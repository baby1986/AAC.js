(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("ADTS", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
/*
- Audio Data Transport Stream (ADTS)
- TechnicalTerms
    - https://github.com/uupaa/AAC.js/wiki/TechnicalTerms
- ADTSHeaderObject:  - https://github.com/uupaa/AAC.js/wiki/ADTSHeaderObject
    - mpegVersion:          UINT8,              // MPEG Version. 2 (MPEG-2) or 4 (MPEG-4)
    - crcProtection:        Boolean,            // has CRC value
    - audioObjectType:      String,             // "AAC-LC"
    - samplingRate:         UINT32,             // sampling rate (Sampling frequency)
    - channels:             Number,             // 1(mono) or 2(L/R)
    - adtsFrameLength:      UINT16,             // ADTS Frame length. (= adtsHeaderLength + crcLength)
    - adtsHeaderLength:     UINT16,             // ADTS Header length. every 7
    - rawDataBlockLength:   UINT16,             // Raw Data Block length (= end - begin)
    - rawDataBlockBegin:    UINT32,             // Raw Data Block begin position
    - rawDataBlockEnd:      UINT32,             // Raw Data Block end position
    - bufferFullness:       UINT16,             // adts_buffer_fullness
    - rdbsInFrame:          UINT8,              // number_of_raw_data_blocks_in_frame
    - crcLength:            UINT8,              // CRC length (0 or 2)
    - crc1:                 UINT16,             // CRC16 value
    - crc2:                 UINT16,             // calcurate CRC16 value
    - error:                Boolean,
- ADTSObject - https://github.com/uupaa/AAC.js/wiki/ADTSObject
    - duration:             Number,                 // duration.
    - durationString:       String,                 // "(1 / samplingRate) * samples * frameCount)"
    - frames:               ADTSFrameObjectArray,   // [ADTSFrameObject, ...]
    - rawDataBlocks:        UINT32Array,            // Raw Data Block position pairs. [<ADTSFrame[0].rawDataBlockBegin, ADTSFrame[0].rawDataBlockEnd>, ...]
    - headerBytes:          UINT32,                 // Total ADTS Header bytes
    - bodyBytes:            UINT32,                 // Total ADTS Raw Data Block bytes
    - errorBytes:           UINT32,                 //
    - contamination:        Boolean,                // difference between the latest properties.
 */
// --- dependency modules ----------------------------------
var Hash = WebModule["Hash"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
var SAMPLING_RATES = {
     0: 96000, // `0000` - 96000 Hz
     1: 88200, // `0001` - 88200 Hz
     2: 64000, // `0010` - 64000 Hz
     3: 48000, // `0011` - 48000 Hz
     4: 44100, // `0100` - 44100 Hz
     5: 32000, // `0101` - 32000 Hz
     6: 24000, // `0110` - 24000 Hz
     7: 22050, // `0111` - 22050 Hz
     8: 16000, // `1000` - 16000 Hz
     9: 12000, // `1001` - 12000 Hz
    10: 11025, // `1010` - 11025 Hz
    11:  8000, // `1011` - 8000 Hz
    12:  7350, // `1100` - 7350 Hz
    13:     0, // `1101` - Reserved
    14:     0, // `1110` - Reserved
    15:     0, // `1111` - other
};

var CHANNELS = {
     0: 0.0,
     1: 1.0,    //   1 ch - (Front:       center)
     2: 2.0,    //   2 ch - (Front: left,         right)
     3: 3.0,    //   3 ch - (Front: left, center, right)
     4: 4.0,    //   4 ch - (Front: left, center, right)                   (Rear:       center)
     5: 5.0,    //   5 ch - (Front: left, center, right)                   (Rear: left,        right)
     6: 5.1,    // 5.1 ch - (Front: left, center, right)                   (Rear: left,        right, subwoofer)
     7: 7.1,    // 7.1 ch - (Front: left, center, right)(Side: left, right)(Rear: left,        right, subwoofer)
};

var AUDIO_OBJECT_TYPES = {
     0: "AAC-Main",
     1: "AAC-LC",
     2: "AAC-SSR",
     3: "AAC-LTP",
};

// |--------|--------|--------|--------|--------|--------|--------|------|-----------------|-------------------------------------
// | byte 0 | byte 1 | byte 2 | byte 3 | byte 4 | byte 5 | byte 6 | bits | field name      | note
// |--------|--------|--------|--------|--------|--------|--------|------|-----------------|-------------------------------------
// |11111111|1111    |        |        |        |        |        |  12  | Sync word       | `111111111111` (0xFFF)
// |        |    A   |        |        |        |        |        |   1  | MPEG Version    | `0` = MPEG-4, `1` = MPEG-2
// |        |     00 |        |        |        |        |        |   2  | Layer           | every `00`
// |        |       B|        |        |        |        |        |   1  | CRC protection  | `0` = HAS CRC, `1` = NO CRC
// |        |        |CC      |        |        |        |        |   2  | AudioObjectType | `00` = AAC-Main, `01` = AAC-LC, `10` = AAC-SSR, `11` = AAC-LTP
// |        |        |  DDDD  |        |        |        |        |   4  | Sampling rate   | `0100` = 44100, `0111` = 22050, ... SAMPLING_RATES. (Sampling frequency)
// |        |        |      ~ |        |        |        |        |   1  | Private         | `0` = NO, `1` = YES
// |        |        |       F|FF      |        |        |        |   3  | Channels        | `000` = CENTER, `001` = FRONT-CENTER, `010` = LEFT/RIGHT
// |        |        |        |  ~     |        |        |        |   1  | Originality     | `0` = YES, `1` = NO
// |        |        |        |   ~    |        |        |        |   1  | Home            |
// |        |        |        |    ~   |        |        |        |   1  | Copyrighted     |
// |        |        |        |     ~  |        |        |        |   1  | Copyright ID    |
// |        |        |        |      HH|HHHHHHHH|HHH     |        |  13  | Frame length    | フレームの長さ(ADTS Headerを含む)
// |        |        |        |        |        |   IIIII|IIIIII  |  11  | Buffer fullness | ADTSバッファ残量(??), 0x7FF なら VBR を示唆している
// |        |        |        |        |        |        |      JJ|   2  | RDBs in frame   | フレームに含まれるRDBsの数 - 1の値。最大の互換性を得るには常に0にすべき
// |--------|--------|--------|--------|--------|--------|--------|------|-----------------|--------------------------------------
var PACKING_A = _toUint8Array(
        "FFF150801162B8" + // ADTS Header (MPEG-4, AAC-LC, 44100Hz, L/R, FrameLength = 139 byte, NO-CRC, duration = 0.046439909297052155)
        "2111450014500146F6C10A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5E" +
        "FFF150801162B8" +
        "2111450014500146F6C10A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5E");

var PACKING_B = _toUint8Array(
        "FFF15C8022C274" + // ADTS Header (MPEG-4, HE-AACv1, 44100Hz, L/R, FrameLength = 278 byte, NO-CRC, duration = 0.046439909297052155)
        "2121450014500146DDF2415D0800000000706000C00DFD2214B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4BC");

var PACKING_C = _toUint8Array(
        "FFF15C4022C1E8" + // ADTS Header (MPEG-4, HE-AACv2, 22050Hz, Mono (parametric), FrameLength = 278 byte, NO-CRC, duration = 0.046439909297052155)
        "01402280A36EFB809C08000000000012A00006FEC10A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A5A" +
        "5A5A5A5A5A5A5E");

// --- class / interfaces ----------------------------------
var ADTS = {
    "VERBOSE":          VERBOSE,
    "parse":            ADTS_parse,         // ADTS.parse(source:Uint8Array, cursor:UINT32 = 0):ADTSObject
    "parseHeader":      ADTS_parseHeader,   // ADTS.parseHeader(source:Uint8Array, cursor:UINT32 = 0):ADTSHeaderObject
    "toBlob":           ADTS_toBlob,        // ADTS.toBlob(source:Uint8Array, pad:UINT8 = 0, adts:ADTSObject = null):Blob
    "PACKING_A":        PACKING_A,          // AAC-LC 44100Hz
    "PACKING_B":        PACKING_B,          // HE-AAC v1 44100Hz
    "PACKING_C":        PACKING_C,          // HE-AAC v2 44100Hz(22050Hz mono)
};

// --- implements ------------------------------------------
function ADTS_parse(source,   // @arg Uint8Array - ADTS+RawDataBlocks (raw level byte stream).
                    cursor) { // @arg UINT32 = 0 - source offset.
                              // @ret AudioMetaDataObject
//{@dev
    if (VERIFY) {
        $valid($type(source, "Uint8Array"),  ADTS_parse, "source");
        $valid($type(cursor, "UINT32|omit"), ADTS_parse, "cursor");
    }
//}@dev

    var view            = { source: source, cursor: cursor || 0 };
    var sourceLimit     = view.source.length; // - 7; // ADTSHeader length
    var frames          = []; // ADTSFrameObjectArray - [ADTSFrame, ...]
    var rawDataBlocks   = [];
    var headerBytes     = 0;
    var bodyBytes       = 0;
    var errorBytes      = 0;
    var contamination   = false;

    // --- contamination check ---
    var latest_mpegVersion     = 0;
    var latest_audioObjectType = "";
    var latest_channels        = 0.0;
    var latest_samplingRate    = 0;

    while (view.cursor < sourceLimit) {
        var header = ADTS_parseHeader(view.source, view.cursor);

        if (header["error"]) {
            view.cursor++; // skip unknown byte
            errorBytes++;
        } else {
            // --- examine the difference between the latest properties ---
            var mpegVersion     = header["mpegVersion"];
            var audioObjectType = header["audioObjectType"];
            var channels        = header["channels"];
            var samplingRate    = header["samplingRate"];

            if (latest_mpegVersion && latest_mpegVersion !== mpegVersion) {
                console.error("MPEG Version unmatched", mpegVersion, latest_mpegVersion);
                contamination = true;
            }
            if (latest_audioObjectType && latest_audioObjectType !== audioObjectType) {
                console.error("Audio Object Type unmatched", audioObjectType, latest_audioObjectType);
                contamination = true;
            }
            if (latest_channels && latest_channels !== channels) {
                console.error("Channels unmatched", channels, latest_channels);
                contamination = true;
            }
            if (latest_samplingRate && latest_samplingRate !== samplingRate) {
                console.error("Sampling Rate unmatched", samplingRate, latest_samplingRate);
                contamination = true;
            }

            latest_mpegVersion     = mpegVersion;
            latest_audioObjectType = audioObjectType;
            latest_channels        = channels;
            latest_samplingRate    = samplingRate;

          //if (header["rdbsInFrame"] === 0) {
          //    adts_error_check();
          //    raw_data_block();
          //} else {
          //    adts_header_error_check();
          //    for (i = 0; i <= number_of_raw_data_blocks_in_frame; i++) {
          //        raw_data_block();
          //        adts_raw_data_block_error_check();
          //    }
          //}

            // store begin/end position pair.
            rawDataBlocks.push( header["rawDataBlockBegin"], header["rawDataBlockEnd"] );

            headerBytes += header["adtsHeaderLength"] + header["crcLength"];
            bodyBytes   += header["rawDataBlockLength"];
            view.cursor += header["adtsFrameLength"];
            frames.push(header);
        }
    }

    var duration        = 0;
    var durationString  = "";

    if (frames.length) {
        duration        =  (1 /     frames[0]["samplingRate"]       ) * 1024         *     frames.length;
        durationString  = "(1 / " + frames[0]["samplingRate"] + " Hz) * 1024 samples * " + frames.length + " frames";
    }
    var adtsObject = {
        "duration":         duration,
        "durationString":   durationString,
        "frames":           frames,         // ADTS Frames [{...}, ... ]
        "rawDataBlocks":    rawDataBlocks,  // Raw Data Block position pairs. [<ADTSFrame[0].rawDataBlockBegin, ADTSFrame[0].rawDataBlockEnd>, ... ]
        "headerBytes":      headerBytes,    // total ADTS Header bytes
        "bodyBytes":        bodyBytes,      // total ADTS Raw Data Block bytes
        "errorBytes":       errorBytes,
        "contamination":    contamination,
    };
    return adtsObject;
}

function ADTS_parseHeader(source,   // @arg Uint8Array - ADTS+RawDataBlocks (raw level byte stream).
                          cursor) { // @arg UINT32 = 0 - source offset.
                                    // @ret ADTSHeaderObject - { mpegVersion, ... error }
    var byte0 = source[cursor];
    var byte1 = source[cursor + 1];
    var byte2 = source[cursor + 2];
    var byte3 = source[cursor + 3];
    var byte4 = source[cursor + 4];
    var byte5 = source[cursor + 5];
    var byte6 = source[cursor + 6];
    var byte7 = source[cursor + 7];
    var byte8 = source[cursor + 8];

    // adts_fixed_header()
    var syncWord            = (byte0 === 0xFF) && ((byte1 & 0xF0) === 0xF0); // find sync word.
    var mpegVersion         = (byte1 & 0x08) === 1 ? 2 : 4;                         // A: `0` = MPEG4, `1` = MPEG2
    var layer               = (byte1 & 0x06) === 0 ? true : false;                  // every `00`
    var crcProtection       = (byte1 & 0x01) === 0 ? true : false;                  // B: `0` = HAS CRC, `1` = NO CRC
    var audioObjectType     = AUDIO_OBJECT_TYPES[(byte2 & 0xC0) >> 6];              // C: `01` = AAC-LC
    var samplingRate        = SAMPLING_RATES[(byte2 & 0x3C) >> 2];                  // D: `0100` = 44100
    var channels            = CHANNELS[((byte2 & 0x1) << 2 | byte3 & 0xC0) >> 6];   // F:  2 = LEFT+RIGHT
    // adts_variable_header()
    //  adtsFrameLength     = adtsHeaderLength + crcLength + rawDataBlockLenggth
    var adtsFrameLength     = (byte3 & 0x03) << 11 |        // |------HH|        |        |
                               byte4         << 3  |        // |        |HHHHHHHH|        |
                              (byte5 & 0xe0) >> 5;          // |        |        |HHH-----|
    var bufferFullness      = (byte5 & 0x1f) << 6  | byte6 >> 2;
    var rdbsInFrame         = (byte6 & 0x03);
    var adtsHeaderLength    = 7;
    var crcLength           = crcProtection ? 2 : 0;
    var rawDataBlockLength  = adtsFrameLength - adtsHeaderLength - crcLength;
    var rawDataBlockBegin   = cursor + adtsHeaderLength;
    var rawDataBlockEnd     = cursor + adtsFrameLength;
    var crc1                = crcProtection ? (((byte7 << 8) | byte8) >>> 0) : 0;
    var crc2                = crc1;
    var error               = false;

    if (VERIFY && crcProtection) {
        crc2 = Hash["CRC"]( source.subarray( rawDataBlockBegin, rawDataBlockEnd ), Hash["CRC16_IBM"] );
    }
    if (!syncWord || !layer || audioObjectType !== "AAC-LC") {
        error = true;
    }
    if (crc1 !== crc2) {
        console.error("CRC unmatched", crc1, crc2);
        error = true;
    }

    // ADTSHeaderObject
    return {
        "mpegVersion":          mpegVersion,
        "crcProtection":        crcProtection,
        "audioObjectType":      audioObjectType,
        "samplingRate":         samplingRate,
        "channels":             channels,
        "adtsFrameLength":      adtsFrameLength,
        "adtsHeaderLength":     adtsHeaderLength,
        "crcLength":            crcLength,
        "rawDataBlockLength":   rawDataBlockLength,
        "rawDataBlockBegin":    rawDataBlockBegin,
        "rawDataBlockEnd":      rawDataBlockEnd,
        "bufferFullness":       bufferFullness,
        "rdbsInFrame":          rdbsInFrame,
        "crc1":                 crc1,
        "crc2":                 crc2,
        "error":                error,
    };
}

function ADTS_toBlob(source, // @arg Uint8Array - ADTS+RawDataBlocks Stream
                     pad,    // @arg UINT8 = 0 - post-extend packing buffer length.
                     adts) { // @arg ADTSObject = null - { audioObjectType, samplingrate }
//{@dev
    $valid($type(source, "Uint8Array"),      ADTS_toBlob, "source");
    $valid($type(pad,    "UINT8|omit"),      ADTS_toBlob, "pad");
    $valid($type(adts,   "ADTSObject|omit"), ADTS_toBlob, "adts");
//}@dev

    pad = pad || 0;

    var packing = PACKING_A;

    if (adts) {
        if (adts["frames"].length) {
            var f0 = adts["frames"][0];

            if (f0["audioObjectType"] === "AAC-LC") {
                if (f0["samplingRate"] === 44100) {
                    packing = PACKING_B;
                } else if (f0["samplingRate"] === 22050) {
                    packing = PACKING_C;
                }
            }
        }
    }
    var buffer = [source];

    for (var i = 0, iz = pad; i < iz; ++i) {
        buffer.push(packing);
    }
    return new Blob(buffer, { "type": "audio/aac" });
}

function _toUint8Array(hexString) { // @arg HexString
                                    // @ret Uint8Array
    var result = new Uint8Array(hexString.length / 2);
    var bytes = hexString.split("");

    for (var i = 0, j = 0, iz = bytes.length; i < iz; i += 2, ++j) {
        result[j] = parseInt(bytes[i] + bytes[i + 1], 16);
    }
    return result;
}

return ADTS; // return entity

});

