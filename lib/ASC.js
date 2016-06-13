(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("ASC", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
/*
- TechnicalTerms
    - https://github.com/uupaa/AAC.js/wiki/TechnicalTerms
- AudioSpecificConfig (ASC)
    - ISO/IEC 14496-3 2009
- AudioSpecificConfigDataObject
    - https://github.com/uupaa/AAC.js/wiki/AudioSpecificConfigDataObject
    - AudioSpecificConfigDataObject:Object
        - type: "asc",


| Audio Object Type | Object Type ID |
|-------------------|----------------|
| AAC-LC            | 2              |
| HE-AAC v1 (SBR)   | 5              |
| HE-AAC v2 (PS)    | 29             |
*/

//var AUDIO_OBJECT_TYPE_AAC_LC    = 2;
var AUDIO_OBJECT_TYPE_HE_AAC_V1 = 5;
var AUDIO_OBJECT_TYPE_HE_AAC_V2 = 29;

// --- dependency modules ----------------------------------
var BitView = WebModule["BitView"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
var ASC = {
    "VERBOSE":      VERBOSE,
    "parse":        ASC_parse, // ASC.parse(source:Uint8Array, cursor:UINT32 = 0):AudioSpecificConfigDataObject
};

// --- implements ------------------------------------------
function ASC_parse(source,   // @arg Uint8Array - raw level byte stream.
                   cursor) { // @arg UINT32 = 0 - source offset.
                             // @ret AudioSpecificConfigDataObject
//{@dev
    if (VERIFY) {
        $valid($type(source, "Uint8Array"),  ASC_parse, "source");
        $valid($type(cursor, "UINT32|omit"), ASC_parse, "cursor");
    }
//}@dev

    var bitView = new BitView(source, cursor || 0);

    var samplingFrequency = 0;
    var extensionAudioObjectType = 0;
    var extensionSamplingFrequencyIndex = 0;
    var extensionSamplingFrequency = 0;

    var audioObjectType = _getAudioObjectType(bitView);
    var samplingFrequencyIndex = bitView["u"](4);

    if (samplingFrequencyIndex === 0xf) {
        samplingFrequency = bitView["u"](24);
    }
    var channelConfiguration = bitView["u"](4);
    var sbrPresentFlag = -1;
    var psPresentFlag  = -1;

    if (audioObjectType === AUDIO_OBJECT_TYPE_HE_AAC_V1 ||
        audioObjectType === AUDIO_OBJECT_TYPE_HE_AAC_V2) {

        extensionAudioObjectType = AUDIO_OBJECT_TYPE_HE_AAC_V1;
        sbrPresentFlag = 1;
        if (audioObjectType === AUDIO_OBJECT_TYPE_HE_AAC_V2) {
            psPresentFlag = 1;
        }
        extensionSamplingFrequencyIndex = bitView["u"](4);
        if (extensionSamplingFrequencyIndex === 0xf) {
            extensionSamplingFrequency = bitView["u"](24);
        }
        audioObjectType = _getAudioObjectType(bitView);
    } else {
        extensionAudioObjectType = 0;
    }

    var specificConfig = null; // { frameLengthFlag, dependsOnCoreCoder, coreCoderDelay }

    if (audioObjectType === 2) {
        specificConfig = _parseGASpecificConfig(bitView, samplingFrequencyIndex,
                                                channelConfiguration /*, audioObjectType */);
    }
    var syncExtensionType = 0;
    if (extensionAudioObjectType !== 5 && bitView["remainBits"] >= 16) {
        syncExtensionType = bitView["u"](11);
        if (syncExtensionType === 0x2b7) {
            extensionAudioObjectType = _getAudioObjectType(bitView);
            if (extensionAudioObjectType === 5) {
                sbrPresentFlag = bitView["u"](1);
                if (sbrPresentFlag === 1) {
                    extensionSamplingFrequencyIndex = bitView["u"](4);
                    if (extensionSamplingFrequencyIndex === 0xf) {
                        extensionSamplingFrequency = bitView["u"](24);
                    }
                    if (bitView["remainBits"] >= 12) {
                        syncExtensionType = bitView["u"](11);
                        if (syncExtensionType === 0x548) {
                            psPresentFlag = bitView["u"](1);
                        }
                    }
                }
            }
        }
    }
    return {
        "specificConfig":           specificConfig,
        "samplingFrequency":        samplingFrequency,
        "extensionAudioObjectType": extensionAudioObjectType,
        "extensionSamplingFrequencyIndex": extensionSamplingFrequencyIndex,
        "extensionSamplingFrequency": extensionSamplingFrequency,
        "audioObjectType":          audioObjectType,
        "samplingFrequencyIndex":   samplingFrequencyIndex,
        "channelConfiguration":     channelConfiguration,
        "sbrPresentFlag":           sbrPresentFlag,
        "psPresentFlag":            psPresentFlag,
    };
}

function _getAudioObjectType(bitView) { // @arg BitView
    var audioObjectType = bitView["u"](5);

    if (audioObjectType === 31) {
        var audioObjectTypeExt = bitView["u"](6);

        audioObjectType = 32 + audioObjectTypeExt;
    }
    return audioObjectType;
}

function _parseGASpecificConfig(bitView, samplingFrequencyIndex, channelConfiguration /*, audioObjectType */) { // @ret Object - { frameLengthFlag, dependsOnCoreCoder, coreCoderDelay }
    var frameLengthFlag = bitView["u"](1);
    var dependsOnCoreCoder = bitView["u"](1);
    var coreCoderDelay = 0;
    if (dependsOnCoreCoder === 1) {
        coreCoderDelay = bitView["u"](14);
    }

    if (channelConfiguration === 0) {
      //program_config_element();
        throw new Error("NOT_IMPL program_config_element");
    }
  //var layerNr = 0;
  //if (audioObjectType === 6 || audioObjectType === 20) {
  //    layerNr = bitView["u"](3);
  //}
    var extensionFlag = bitView["u"](1);
  //var numOfSubFrame = 0;
  //var layer_length = 0;
  //var aacSectionDataResilienceFlag = 0;
  //var aacScalefactorDataResilienceFlag = 0;
  //var aacSpectralDataResilienceFlag = 0;
    var extensionFlag3 = 0;
    if (extensionFlag === 1) {
      //if (audioObjectType === 22) {
      //    numOfSubFrame = bitView["u"](5);
      //    layer_length = bitView["u"](11);
      //}
      //if (audioObjectType === 17 || audioObjectType === 19 ||
      //    audioObjectType === 20 || audioObjectType === 23) {
      //    aacSectionDataResilienceFlag     = bitView["u"](1);
      //    aacScalefactorDataResilienceFlag = bitView["u"](1);
      //    aacSpectralDataResilienceFlag    = bitView["u"](1);
      //}
        extensionFlag3 = bitView["u"](1);
        if (extensionFlag3 === 1) {
            // TBD: version 3
        }
    }

    return {
        "frameLengthFlag":    frameLengthFlag,
        "dependsOnCoreCoder": dependsOnCoreCoder,
        "coreCoderDelay":     coreCoderDelay,
    };
}

return ASC; // return entity

});

