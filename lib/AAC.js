(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("AAC", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
/*
- TechnicalTerms
    - https://github.com/uupaa/AAC.js/wiki/TechnicalTerms
- ADTSHeaderObject
    - https://github.com/uupaa/AAC.js/wiki/ADTSHeaderObject
*/

// --- dependency modules ----------------------------------
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
var AAC_44100_LR_2 = _toUint8Array(
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

var AAC_44100_LR_5 = _toUint8Array(
        "FFF15C8022C274" + // ADTS Header (MPEG-4, HE-AACv1, 44100Hz, L/R, FrameLength = 278 byte, NO-CRC, duration = 0.046439909297052155)
        "2111450014500146DDF2415D0800000000706000C00DFD2214B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4B4" +
        "B4B4B4B4B4B4BC");

var AAC_44100_LR_29 = _toUint8Array(
        "FFF15C4022C1E8" + // ADTS Header (MPEG-4, HE-AACv2, 22050Hz, Center (parametric), FrameLength = 278 byte, NO-CRC, duration = 0.046439909297052155)
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
var AAC = {
    "VERBOSE":              VERBOSE,
    "repository":           "https://github.com/uupaa/AAC.js",
    "ESTIMATED_DURATION":   false,
    "AAC_44100_LR_2":       AAC_44100_LR_2,
    "AAC_44100_LR_5":       AAC_44100_LR_5,
    "AAC_44100_LR_29":      AAC_44100_LR_29,
};

// --- implements ------------------------------------------
function _init() {
    // --- detect ESTIMATED_DURATION ---
    if (global["AudioContext"]) {
        if (/Chrome/.test(navigator.userAgent)) {
            AAC["ESTIMATED_DURATION"] = true;
        }
        /*
        var audioContext = new AudioContext();
        var AAC_DURATION = 0.046439909297052155;

        audioContext["decodeAudioData"](AAC_44100_LR_2.buffer, function(audioBuffer) {
            if (audioBuffer["duration"] < AAC_DURATION) {
                // Mac Chrome 51: -> 3.204126984126984 ->  7.201950113378685
                // Mac Safari 9:  -> 5.061950206756592 -> 10.123900413513184
                AAC["ESTIMATED_DURATION"] = true;
                if (audioContext["close"]) {
                    audioContext["close"]();
                }
            }
        });
         */
    }
}

function _toUint8Array(hexString) { // @arg HexString - "FFF1F0"
                                    // @ret Uint8Array - new Uint8Array([0xff, 0xf1, 0xf0])
    var result = new Uint8Array(hexString.length / 2);
    var bytes = hexString.split("");

    for (var i = 0, j = 0, iz = bytes.length; i < iz; i += 2, ++j) {
        result[j] = parseInt(bytes[i] + bytes[i + 1], 16);
    }
    return result;
}

_init();

return AAC; // return entity

});

