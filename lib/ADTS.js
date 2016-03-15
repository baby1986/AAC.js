(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("ADTS", function moduleClosure(global) {
"use strict";

// --- technical terms / data structure --------------------
/*

## AAC ADTS Header field

http://wiki.multimedia.cx/index.php?title=ADTS

+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0 (a) |  1 (b) |  2 (c) |  3 (d) |  4 (e) |  5 (f) |  6 (g) |   7    |   8    | bytes
+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|11111111|1111    |        |        |        |        |        |        |        | 12  Sync word:        `111111111111` (0xFFF)
|        |    A   |        |        |        |        |        |        |        |  1  MPEG version:     `0` = MPEG-4, `1` = MPEG-2
|        |     00 |        |        |        |        |        |        |        |  2  Layer:            `00`
|        |       B|        |        |        |        |        |        |        |  1  CRC protection:   `0` = YES, `1` = NO
|        |        |CC      |        |        |        |        |        |        |  2  Profile:          `00` = Main, `01` = LC, `10` = SSR, `11` = reserved.
|        |        |  DDDD  |        |        |        |        |        |        |  4  Sampling rate:    `0100` = 44100, `0111` = 22050, ... SAMPLING_RATE. (Sampling frequency)
|        |        |      ~ |        |        |        |        |        |        |  1  Private:          `0` = NO, `1` = YES
|        |        |       F|FF      |        |        |        |        |        |  3  Channels:         `000` = CENTER, `001` = LEFT/RIGHT
|        |        |        |  ~     |        |        |        |        |        |  1  Originality:      `0` = YES, `1` = NO
|        |        |        |   ~    |        |        |        |        |        |  1  Home:
|        |        |        |    ~   |        |        |        |        |        |  1  Copyrighted:
|        |        |        |     ~  |        |        |        |        |        |  1  Copyright ID:
|        |        |        |      HH|HHHHHHHH|HHH     |        |        |        | 13  Frame length:     フレームの長さ(ADTS Headerを含む)
|        |        |        |        |        |   IIIII|IIIIII  |        |        | 11  Buffer fullness:  ADTSバッファ残量(??), 0x7FF なら VBR を示唆している
|        |        |        |        |        |        |      JJ|        |        |  2  ??:               データブロックまでの長さ. Number of AAC frames (RDBs) in ADTS frame minus 1, for maximum compatibility always use 1 AAC frame per ADTS frame
|        |        |        |        |        |        |        |~~~~~~~~|~~~~~~~~| 16  CRC value:

- AAC は ADTS ヘッダ + AAC データで構成されます
- ADTS ヘッダは、7byte(CRC無し) または 9byte (CRC有り) で構成され、先頭のデータは必ず 0xFFF から始まります
- AAC の 1 frame は 1024 samples で構成されています
- AAC の duration は (1 / (Sampling rate)) * 1024 * frames で計算できます

## Typical ADTS Header

```
MPEG-4, AAC-LC, 44.1KHz, L/R: `11111111`(0xFF), `11110001`(0xF1), `01010000`(0x50), `011000nn`(0x60〜0x63)
```

## calculate duration

- 1秒当りのサンプリング数:
    - 1 sec / 44100 Hz = 0.00002267573696

- 1 frame 当りの長さ(1 frame は 1024 samples):
    - 0.00002267573696 * 1024 samples = 0.02321995464704 (1 frame に 0.02321秒分のデータが格納されている)

- frame が 233個あればduration は 5.41秒になる
    - 0.02321995464704 * 233 = 5.41024943276032 sec


Mac で `afinfo -r file.aac` を実行すると、正確な duration を取得することができます。
なお、afinfo では、1024 frame を 1 packet と表現しています。


## ADTSObject

```js
var AACMetaDataObject = {
    version:            UINT8,                  // MPEG Version. 2 (MPEG-2) or 4 (MPEG-4)
    profile:            String,                 // "Main" or "LC" or "SSR"
    channels:           Number,                 // 1 / 2 / 3 / 4 / 5 / 5.1 / 7.1
    duration:           Number,                 // duration.
    frameCount:         frameCount,             // frame count.
    samplingRate:       UINT32,                 // sampling rate (Sampling frequency)
    header:             ADTSHeaderObjectArray,  // ADTS header. [ADTSHeaderObject, ...]
    bufferRange:        UINT32Array,            // AAC buffer ranges. [<begin, end>, ...]
    totalBufferLength:  UINT32,                 // total buffer length.
};

var ADTSHeaderObject = {
    headerLength:       UINT32,                 // ADTS Header length. 7 or 9
    bufferLength:       UINT32,                 // AAC buffer length.
};
```

*/

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
var VERIFY  = global["WebModule"]["verify"]  || false;
var VERBOSE = global["WebModule"]["verbose"] || false;

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
     1: "LC",
     2: "SSR",
     3: "",
};

// --- class / interfaces ----------------------------------
var ADTS = {
    "parse":    ADTS_parse,     // ADTS.parse(source:Uint8Array, cursor:UINT32 = 0):AACMetaDataObject
    "toBlob":   ADTS_toBlob,    // ADTS.toBlob(source:Uint8Array, metaData:AACMetaDataObject):Blob
};

// --- implements ------------------------------------------
function ADTS_parse(source,   // @arg Uint8Array - ADTS+AAC Stream (raw level byte stream).
                    cursor) { // @arg UINT32 = 0 - source offset.
                              // @options.parseOnly Boolean = false - true is parse only (AACObject.data is empty)
                              // @ret AACMetaDataObject
//{@dev
    if (VERIFY) {
        $valid($type(source, "Uint8Array"),  ADTS_parse, "source");
        $valid($type(cursor, "UINT32|omit"), ADTS_parse, "cursor");
    }
//}@dev

    var view         = { source: source, cursor: cursor || 0 };
    var sourceLimit  = view.source.length - 7; // 7 = minimum buffer length
    var version      = 0;       // AACMetaDataObject.version
    var profile      = "";      // AACMetaDataObject.profile
    var channels     = 0.0;     // AACMetaDataObject.channels
    var duration     = 0;       // AACMetaDataObject.duration
    var frameCount   = 0;       // AACMetaDataObject.frameCount
    var samplingRate = 0;       // AACMetaDataObject.samplingRate
    var header       = [];      // AACMetaDataObject.header
    var bufferRange  = [];      // AACMetaDataObject.bufferRange - [<begin, end>, ...]
    var totalBufferLength = 0;  // AACMetaDataObject.totalBufferLength

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
            var CRC          = 0;

            if (b & 0x01) { // CRC protection
                headerLength = 9;
                bufferLength = frameLength - headerLength;
                CRC          = ((view.source[view.cursor + 7]  <<  8) |
                                 view.source[view.cursor + 8]) >>> 0;
                if (VERBOSE) {
                    console.log("CRC", CRC);
                }
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

    if (VERBOSE) {
        console.dir(result);
    }
    return result;
}

function ADTS_toBlob(source,     // @arg Uint8Array - ADTS+AAC Stream
                     metaData) { // @arg AACMetaDataObject - ADTS.parse result value.
                                 // @ret Blob
    var buffer = [];
    var bufferRange = metaData["bufferRange"];

    for (var i = 0, iz = bufferRange.length; i < iz; i += 2) {
        buffer.push( source.subarray( bufferRange[i], bufferRange[i + 1] ) );
    }
    return new Blob(buffer, { type: "audio/aac" });
}

return ADTS; // return entity

});

