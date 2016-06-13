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
- AudioMetaDataObject
    - https://github.com/uupaa/AAC.js/wiki/AudioMetaDataObject
    - AudioMetaDataObject:Object
        - type:               "adts",
        - version:            UINT8,                  // MPEG Version. 2 (MPEG-2) or 4 (MPEG-4)
        - profile:            String,                 // "Main" or "LC" or "SSR"
        - channels:           Number,                 // 1 / 2 / 3 / 4 / 5 / 5.1 / 7.1
        - duration:           Number,                 // duration.
        - frameCount:         UINT32,                 // frame count.
        - samplingRate:       UINT32,                 // sampling rate (Sampling frequency)
        - header:             ADTSHeaderObjectArray,  // ADTS header. [ADTSHeaderObject, ...]
        - bufferRange:        UINT32Array,            // AAC buffer ranges. [<begin, end>, ...]
        - totalBufferLength:  UINT32,                 // total buffer length.
 */
// --- dependency modules ----------------------------------
var Hash  = WebModule["Hash"];
// --- import / local extract functions --------------------
var CRC16 = Hash["CRC16"] || null;
// --- define / local variables ----------------------------
var SAMPLING_RATE = {
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

var PROFILES = {
     0: "Main",
     1: "LC",       // AAC-LC
     2: "SSR",
     3: "",
};

var SOUNDLESS = new Uint8Array([
    // --- ADTS Header ---
    0xff, 0xf1, 0x50, 0x80, 0x17, 0x02, 0xa4, // MPEG-4, AAC-LC, 44100Hz, L/R, FrameLength = 184byte
    // --- CRC ---
    0x21, 0x11,
    // ----  Raw Data Block ---
    0x45, 0x00, 0x14, 0x50, 0x01, 0x46, 0xf9, 0x91,
    0x0a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a,
    0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5a, 0x5e,
]);

// --- class / interfaces ----------------------------------
var ADTS = {
    "VERBOSE":      VERBOSE,
    "parse":        ADTS_parse,     // ADTS.parse(source:Uint8Array, cursor:UINT32 = 0):AudioMetaDataObject
    "toBlob":       ADTS_toBlob,    // ADTS.toBlob(source:Uint8Array, padRight:UINT8 = 0, padLeft:UINT8 = 0):Blob
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

    var view         = { source: source, cursor: cursor || 0 };
    var sourceLimit  = view.source.length - 7; // 7 = minimum buffer length
    var version      = 0;       // AudioMetaDataObject.version
    var profile      = "";      // AudioMetaDataObject.profile
    var channels     = 0.0;     // AudioMetaDataObject.channels
    var duration     = 0;       // AudioMetaDataObject.duration
    var frameCount   = 0;       // AudioMetaDataObject.frameCount
    var samplingRate = 0;       // AudioMetaDataObject.samplingRate
    var header       = [];      // AudioMetaDataObject.header
    var bufferRange  = [];      // AudioMetaDataObject.bufferRange - [<begin, end>, ...]
    var totalBufferLength = 0;  // AudioMetaDataObject.totalBufferLength

    var a = 0x00;
    var b = 0x00;
    var c = 0x00;
    var d = 0x00;
    var e = 0x00;
    var f = 0x00;

    while (view.cursor < sourceLimit) {
        a = view.source[view.cursor];
        b = view.source[view.cursor + 1];
        c = view.source[view.cursor + 2];
        d = view.source[view.cursor + 3];
        e = view.source[view.cursor + 4];
        f = view.source[view.cursor + 5];

        var syncWord = (a === 0xFF) && ((b & 0xF0) === 0xF0); // find sync word.

        if (syncWord) {
            var frameLength  = (d & 0x03) << 11 |    // |------HH|        |        |
                                e         << 3  |    // |        |HHHHHHHH|        |
                               (f & 0xe0) >> 5;      // |        |        |HHH-----|
            var headerLength = 7;
            var bufferLength = frameLength - headerLength;
            var preCalcCRC   = 0;

            if (b & 0x01) { // CRC protection
                headerLength = 9;
                bufferLength = frameLength - headerLength;
                preCalcCRC   = ((view.source[view.cursor + 7]  <<  8) |
                                 view.source[view.cursor + 8]) >>> 0;
            }

            if (frameCount++ === 0) { // first frame -> pickup ADTS header
                version      = (b & 0x08) === 1 ? 2 : 4;                    // A: `0` = MPEG4, `1` = MPEG2
                profile      = PROFILES[(c & 0xC0) >> 6];                   // C: `00` = Main, `01` = LC, `10` = SSR
                samplingRate = SAMPLING_RATE[(c & 0x3C) >> 2];              // D:
                channels     = CHANNELS[((c & 0x1) << 2 | d & 0xC0) >> 6];  // F: 1 - 7.1
            }
            header.push({
                "headerLength": headerLength,
                "bufferLength": bufferLength,
            });
            var begin = view.cursor + headerLength;
            var end   = view.cursor + frameLength;

            if (VERIFY) {
                if (preCalcCRC && CRC16) {
                    var crcVerify = CRC16( view.source.subarray( view.cursor, view.cursor + frameLength ) ); // CRC includes ADTS header.
                    if (preCalcCRC !== crcVerify) {
                        if (ADTS["VERBOSE"]) {
                            console.error("CRC unmatched", preCalcCRC, crcVerify);
                        }
                    }
                }
            }

            bufferRange.push(begin, end);

            totalBufferLength += end - begin;
            view.cursor       += frameLength;
        } else {
            view.cursor++; // skip unknown byte
        }
    }

    duration = (1 / samplingRate) * 1024 * frameCount;

    var result = {
        "version":      version,        // MPEG Version. 2 (MPEG-2) or 4 (MPEG-4)
        "profile":      profile,        // "Main" or "LC" or "SSR"
        "channels":     channels,       // 1 / 2 / 3 / 4 / 5 / 5.1 / 7.1
        "duration":     duration,       // duration
        "frameCount":   frameCount,     //
        "samplingRate": samplingRate,   // 7359 - 96000
        "header":       header,         // ADTS header. [ ADTSHeaderObject, ... ]
        "bufferRange":  bufferRange,    // AAC binary data range. [<begin, end>, ... ]
        "totalBufferLength": totalBufferLength,
    };

    if (ADTS["VERBOSE"]) {
        console.dir(result);
    }
    return result;
}

function ADTS_toBlob(source,    // @arg Uint8Array - ADTS+RawDataBlocks Stream
                     padRight,  // @arg UINT8 = 0 - pre-extend soundless buffer length.
                     padLeft) { // @arg UINT8 = 0 - post-extend soundless buffer length.
//{@dev
    $valid($type(source,   "Uint8Array"), ADTS_toBlob, "source");
    $valid($type(padRight, "UINT8|omit"), ADTS_toBlob, "padRight");
    $valid($type(padLeft,  "UINT8|omit"), ADTS_toBlob, "padLeft");
//}@dev

    padLeft  = padLeft  || 0;
    padRight = padRight || 0;

    if (padRight === 0 && padLeft === 0) {
        return new Blob([source], { "type": "audio/aac" });
    }

    var buffer = [];

    for (var i = 0, iz = padRight; i < iz; ++i) {
        buffer.push(SOUNDLESS);
    }

    buffer.push(source);

    for (i = 0, iz = padLeft; i < iz; ++i) {
        buffer.push(SOUNDLESS);
    }
    return new Blob(buffer, { "type": "audio/aac" });
}

return ADTS; // return entity

});

