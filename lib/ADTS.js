(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("ADTS", function moduleClosure(global) {
"use strict";

// --- dependency modules ----------------------------------
var Bit     = global["WebModule"]["Bit"];

// --- define / local variables ----------------------------
var VERIFY  = global["WebModule"]["verify"]  || false;
var VERBOSE = global["WebModule"]["verbose"] || false;

var _split8  = Bit["split8"];  // Bit.split8(u32:UINT32, bitPattern:UINT8Array|Uint8Array):UINT32Array
var _split16 = Bit["split16"]; // Bit.split16(u32:UINT32, bitPattern:UINT8Array|Uint8Array):UINT32Array
var _split32 = Bit["split32"]; // Bit.split32(u32:UINT32, bitPattern:UINT8Array|Uint8Array):UINT32Array

var MPEG4_SAMPLING_FREQUENCY = {
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

var FRONT_LEFT      = 0x0100;
var FRONT_CENTER    = 0x0080;
var FRONT_RIGHT     = 0x0040;
var FRONT_LCR       = FRONT_LEFT | FRONT_CENTER | FRONT_RIGHT;
var SIDE_LEFT       = 0x0020;
var SIDE_RIGHT      = 0x0010;
var SIDE_LR         = SIDE_LEFT | SIDE_RIGHT;
var REAR_LEFT       = 0x0008;
var REAR_CENTER     = 0x0004;
var REAR_RIGHT      = 0x0002;
var REAR_SUBWOOFER  = 0x0001;
var REAR_LR         = REAR_LEFT | REAR_RIGHT;

var MPEG4_AAC_CHANNEL = {
     0: 0x0000,
     1: FRONT_CENTER,                           //   1 ch - (Front:       center)
     2: FRONT_LEFT | FRONT_RIGHT,               //   2 ch - (Front: left,         right)
     3: FRONT_LCR,                              //   3 ch - (Front: left, center, right)
     4: FRONT_LCR | REAR_CENTER,                //   4 ch - (Front: left, center, right)                   (Rear:       center)
     5: FRONT_LCR | REAR_LR,                    //   5 ch - (Front: left, center, right)                   (Rear: left,        right)
     6: FRONT_LCR | REAR_LR | REAR_SUBWOOFER,   // 5.1 ch - (Front: left, center, right)                   (Rear: left,        right, subwoofer)
     7: FRONT_LCR | SIDE_LR | REAR_LR |         // 7.1 ch - (Front: left, center, right)(Side: left, right)(Rear: left,        right, subwoofer)
                              REAR_SUBWOOFER,
};

// --- class / interfaces ----------------------------------
var ADTS = {
    "parse": ADTS_parse, // ADTS.parse(source:Uint8Array, cursor:UINT32 = 0, options:Object = {}):ADTSFrameArray
};

// --- implements ------------------------------------------
function ADTS_parse(source,   // @arg Uint8Array - Stream (raw level byte stream).
                    cursor) { // @arg UINT32 = 0 - source offset.
                              // @ret ADTSFrameArray - [ADTSFrame, ...], ADTSFrame = { header: Object, stream: Uint8Array }
//{@dev
    if (VERIFY) {
        $valid($type(source, "Uint8Array"),  ADTS_parse, "source");
        $valid($type(cursor, "UINT32|omit"), ADTS_parse, "cursor");
    }
//}@dev

    var view = { source: source, cursor: cursor || 0 };
    var result = []; // [ADTSFrame, ... ]
    var sourceLength = view.source.length;
    var sourceLimit  = sourceLength - 7; // 7 = minimum buffer length
    var a = 0x00;
    var b = 0x00;
    var c = 0x00;
    var d = 0x00;
    var e = 0x00;
    var f = 0x00;
    var g = 0x00;

    // ADTS Header field
    //     0         1       2        3        4         5       6        7        8
    // |AAAAAAAA|AAAABCCD|EEFFFFGH|HHIJKLMM|MMMMMMMM|MMMOOOOO|OOOOOOPP|QQQQQQQQ|QQQQQQQQ| bit index field
    // +-----------------+
    // |~~~~~~~~ ~~~~    |                                                                12  0     sync_word 0xFFF, all bits must be 1
    // |             ~   |                                                                 1  1     MPEG Version: 0 for MPEG-4, 1 for MPEG-2
    // |              ~~ |                                                                 2  2     Layer: always 0
    // |                ~|                                                                 1  3     protection absent, Warning, set to 1 if there is no CRC and 0 if there is CRC
    // +-----------------+-----------------+
    //                   |~~               |                                               2  0     profile, the MPEG-4 Audio Object Type minus 1
    //                   |  ~~~~           |                                               4  1     MPEG-4 Sampling Frequency Index (15 is forbidden)
    //                   |      ~          |                                               1  2     private bit, guaranteed never to be used by MPEG, set to 0 when encoding, ignore when decoding
    //                   |       ~ ~~      |                                               3  3     MPEG-4 Channel Configuration (in the case of 0, the channel configuration is sent via an inband PCE)
    //                   |           ~     |                                               1  4     originality, set to 0 when encoding, ignore when decoding
    //                   |            ~    |                                               1  5     home, set to 0 when encoding, ignore when decoding
    //                   |             ~   |                                               1  6     copyrighted id bit, the next bit of a centrally registered copyright identifier, set to 0 when encoding, ignore when decoding
    //                   |              ~  |                                               1  7     copyright id start, signals that this frame's copyright id bit is the first bit of the copyright id, set to 0 when encoding, ignore when decoding
    //                   |               ~~|~~~~~~~~ ~~~                                  13  8     frame length, this value must include 7 or 9 bytes of header length: FrameLength = (ProtectionAbsent == 1 ? 7 : 9) + size(AACFrame)
    //                   +-----------------+--------+--------+--------+
    //                                              |   ~~~~~ ~~~~~~  |                   11  0     Buffer fullness
    //                                              |               ~~|                    2  1     Number of AAC frames (RDBs) in ADTS frame minus 1, for maximum compatibility always use 1 AAC frame per ADTS frame
    //                                              +-----------------+-----------------+
    //                                                                |~~~~~~~~ ~~~~~~~~| 16  0     CRC if protection absent is 0
    //                                                                +-----------------+
    while (view.cursor < sourceLimit) {
        var a = view.source[view.cursor];
        var b = view.source[view.cursor + 1];
        var c = view.source[view.cursor + 2];
        var d = view.source[view.cursor + 3];
        var e = view.source[view.cursor + 4];
        var f = view.source[view.cursor + 5];
        var g = view.source[view.cursor + 6];

        if (VERBOSE) {
            console.log("AAAAAAAA", "AAAABCCD", "EEFFFFGH", "HHIJKLMM", "MMMMMMMM", "MMMOOOOO", "OOOOOOPP");
            console.log(_b(a), _b(b), _b(c), _b(d), _b(e), _b(f), _b(g));
        }

        var sync_word = (a === 0xFF) && ((b & 0xF0) === 0xF0); // find sync_word `AAAAAAAA AAAA----`
        if (sync_word) {
            var frameLength = _getFrameLength(view);
            var frame = _readADTSFrame( view.source.subarray(view.cursor, view.cursor + frameLength) );
            if (VERBOSE) {
                console.log("frameLength: " + frameLength);
            }

            result.push(frame);
            view.cursor += frameLength;

            if (VERBOSE) {
                console.log("frameLength: " + frameLength);
                console.dir(result[result.length - 1]["header"]);
            }
        } else {
            view.cursor++; // skip unknown byte
        }
    }
    return result;
}

function _readADTSFrame(source) { // @arg Uint8Array
    var subview = { source: source, cursor: 1 };

    var field1              = _split8(_read1(subview), [4, 1, 2, 1]); // [AAAA, B, CC, D]
    var MPEGVersion         = field1[1];    // B 0 = MPEG4, 1 = MPEG2
    var layer               = field1[2];    // C `00`
    var hasCRC              = !field1[3];   // D 0 = has CRC, 1 = has not CRC
    var field2              = _split16(_read2(subview), [2, 4, 1, 3, 1, 1, 1, 1]); // [EE, FFFF, G, HHH, I, J, K, L]
    var profile             = field2[0];    // E (MPEG-2 Audio Object type - 1) `00` = Main, `01` = LC, `10` = SSR
    var sampling            = field2[1];    // F MPEG4_SAMPLING_FREQUENCY
    var privateBit          = field2[2];    // G ignore
    var channel             = field2[3];    // H MPEG4_AAC_CHANNEL
    var originality         = field2[4];    // I ignore
    var home                = field2[5];    // J ignore
    var copyrighted         = field2[6];    // K ignore
    var copyright           = field2[7];    // L ignore
    subview.cursor++;
    var field3              = _split16(_read2(subview), [3, 11, 2]); // [MMM, OOOOOOOOOOO, PP]
    var bufferFullness      = field3[1];    // O
    var numberOfAACFrames   = field3[2];    // P
    var CRC                 = 0;

    if (hasCRC) {
        CRC                 = _read2(subview);
    }
    if (VERIFY) {
        if (layer !== 0x00) { throw new TypeError("BAD_FORMAT layer: ", layer); }
    }

    var ADTSFrame = {
            "header": {
                "AAC_LC":       profile === 1,
                "MONORAL":      channel === 1,
                "FREQUENCY":    MPEG4_SAMPLING_FREQUENCY[sampling],
                "AAC_FRAMES":   numberOfAACFrames,
                "MPEGVersion":  MPEGVersion === 0 ? 4 : 2, // MPEG-4 AAC or MPEG-2 AAC
            },
            "stream": subview.source.subarray(subview.cursor)
        };
    return ADTSFrame;
}

function _getFrameLength(view) {
    // 12    87       0
    //  ---------------
    // "MM MMMMMMMM MMM"
    // "00 00100010 100"
    return (view.source[view.cursor + 3] & 0x03) << 11 |
           (view.source[view.cursor + 4] & 0xff) << 3  |
           (view.source[view.cursor + 5] & 0xe0) >> 5;
}

function _read4(view) { // @ret UINT32
    return ((view.source[view.cursor++]  << 24) |
            (view.source[view.cursor++]  << 16) |
            (view.source[view.cursor++]  <<  8) |
             view.source[view.cursor++]) >>> 0;
}

function _read3(view) { // @ret UINT32
    return ((view.source[view.cursor++]  << 16) |
            (view.source[view.cursor++]  <<  8) |
             view.source[view.cursor++]) >>> 0;
}

function _read2(view) { // @ret UINT16
    return ((view.source[view.cursor++]  <<  8) |
             view.source[view.cursor++]) >>> 0;
}

function _read1(view) { // @ret UINT8
    return view.source[view.cursor++] >>> 0;
}

function _b(n) {
    return (0x100 + n).toString(2).slice(1);
}

return ADTS; // return entity

});

