(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("ADTSRawDataBlocks", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
/*

- TechnicalTerms
    - https://github.com/uupaa/AAC.js/wiki/TechnicalTerms

 */
// --- dependency modules ----------------------------------
// var BitView = WebModule["BitView"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
/*
var PRED_SFB_MAX_TABLE = {
    96000: 33,
    88200: 33,
    64000: 38,
    48000: 40,
    44100: 40,
    32000: 40,
    24000: 41,
    22050: 41,
    16000: 37,
    12000: 37,
    11025: 37,
     8000: 34,
};

var ID_SCE = 0x0; // single_channel_element
var ID_CPE = 0x1; // channel_pair_element
var ID_CCE = 0x2; // coupling_channel_element
var ID_LFE = 0x3; // lfe_channel_element
var ID_DSE = 0x4; // data_stream_element
var ID_PCE = 0x5; // program_config_element
var ID_FIL = 0x6; // fill_element HE-AAC, HE-AAC v2 の情報はこの中に格納されている
var ID_END = 0x7;

var ZERO_HCB        = 0;
var PAIR_LEN        = 2;
var QUAD_LEN        = 4;
var FIRST_PAIR_HCB  = 5;
var ESC_HCB         = 11
var NOISE_HCB       = 13;
var INTENSITY_HCB2  = 14;
var INTENSITY_HCB   = 15;
var ESC_FLAG        = 16;

// --- WINDOW_SEQUENCE ---
var ONLY_LONG_SEQUENCE   = 0;
var LONG_START_SEQUENCE  = 1;
var EIGHT_SHORT_SEQUENCE = 2;
var LONG_STOP_SEQUENCE   = 3;
 */

/*
    Table C.26 – Huffman Codebooks

| Codebook index    | n-Tuple size  | Maximum absolute value    | Signed values |
|-------------------|---------------|---------------------------|---------------|
| 0                 |               | 0                         |               |
| 1                 | 4             | 1                         | yes           |
| 2                 | 4             | 1                         | yes           |
| 3                 | 4             | 2                         | no            |
| 4                 | 4             | 2                         | no            |
| 5                 | 2             | 4                         | yes           |
| 6                 | 2             | 4                         | yes           |
| 7                 | 2             | 7                         | no            |
| 8                 | 2             | 7                         | no            |
| 9                 | 2             | 12                        | no            |
| 10                | 2             | 12                        | no            |
| 11                | 2             | 16 (ESC)                  | no            |
 */
/*

- 9. Noiseless Coding
    - 9.1 Tool Description
    - 9.2 Definitions
    - 9.2.1 Data Elements
        - hcod_sf[] Huffman codeword from the Huffman code Table used for coding of scalefactors (see subclause 6.3, Table 18).
    - 9.3 Decoding Process
    - 9.4 Tables
        - Table 58 - Scalefactor Huffman codebook parameters

            | Codebook Number       | Dimension of Codebook | index_offset  | Range of values | Codebook listed in |
            |-----------------------|-----------------------|---------------|-----------------|--------------------|
            | 0                     | 1                     | -60           | -60 to +60      | Table A.1          |

        - Table 59 - Spectrum Huffman codebooks parameters

            | Codebook Number, i    | unsigned_cb[i]    | Dimension of Codebook | LAV for codebook  | Codebook listed in    |
            |-----------------------|-------------------|-----------------------|-------------------|-----------------------|
            | 0                     |                   |                       |                   |                       |
            | 1                     | 0                 | 4                     | 1                 | Table A.2             |
            | 2                     | 0                 | 4                     | 1                 | Table A.3             |
            | 3                     | 1                 | 4                     | 2                 | Table A.4             |
            | 4                     | 1                 | 4                     | 2                 | Table A.5             |
            | 5                     | 0                 | 2                     | 4                 | Table A.6             |
            | 6                     | 0                 | 2                     | 4                 | Table A.7             |
            | 7                     | 1                 | 2                     | 7                 | Table A.8             |
            | 8                     | 1                 | 2                     | 7                 | Table A.9             |
            | 9                     | 1                 | 2                     | 12                | Table A.10            |
            | 10                    | 1                 | 2                     | 12                | Table A.11            |
            | 11                    | 1                 | 2                     | (16) ESC          | Table A.12            |

 */

// --- class / interfaces ----------------------------------
var ADTSRawDataBlocks = {
    "VERBOSE":  VERBOSE,
//  "parse":    ADTSRawDataBlocks_parse,
};

// --- implements ------------------------------------------
/*
function ADTSRawDataBlocks_parse(bitView, // @arg BitView - new BitView(RawDataBlockBegin, RawDataBlockEnd)
                                 frame) { // @arg ADTSFrameObject - { mpegVersion, ... error }
//{@dev
    if (VERIFY) {
        $valid($type(bitView, "BitView"),         ADTSRawDataBlocks_parse, "bitView");
        $valid($type(frame,   "ADTSFrameObject"), ADTSRawDataBlocks_parse, "frame");
    }
//}@dev

    // +---------------+    +------------------+    +------------+    +------------+    +-----+    +-----+    +-------+    +-----+    +-----+
    // | AAC BitStream | -> | NoislessDecoding | -> | Dequantize | -> | JointStreo | -> | PNS | -> | TNS | -> | INDCT | -> | SBR | -> | PCM |
    // +---------------+    +------------------+    +------------+    +------------+    +-----+    +-----+    +-------+    +-----+    +-----+
    _raw_data_block(bitView, frame);
}


function _raw_data_block(bitView, frame) {
    var id = bitView["u"](3); // |11100000|

    while (id !== ID_END) {
        var ics = {};

        switch (id) {
        case ID_SCE: single_channel_element(bitView, frame, ics); break;
        case ID_CPE: channel_pair_element(bitView, frame, ics); break;
//      case ID_CCE: coupling_channel_element(bitView, frame, ics); break;
//      case ID_LFE: lfe_channel_element(bitView, frame, ics); break;
//      case ID_DSE: data_stream_element(bitView, frame, ics); break;
//      case ID_PCE: program_config_element(bitView, frame, ics); break;
        case ID_FIL: fill_element(bitView, frame, ics); break;
        }
        bitView["byteAlign"]();
    }
}

function single_channel_element(bitView, frame, ics) {
    var element_instance_tag = bitView["u"](4);

    individual_channel_stream(bitView, 0, ics);
}

function individual_channel_stream(bitView, common_window, ics) {
    var global_gain = bitView["u"](8);

    if (!common_window) {
        ics = ics_info();
    }

    section_data(bitView, ics);
    scale_factor_data(bitView, ics); // TODO: impl

    var pulse_data_present = bitView["u"](1);
    if (pulse_data_present) {
        pulse_data(bitView, ics); // TODO: impl
    }
    var tns_data_present = bitView["u"](1);
    if (tns_data_present) {
        tns_data(bitView, ics); // TODO: impl
    }
    var gain_control_data_present = bitView["u"](1);
    if (gain_control_data_present) {
        gain_control_data(bitView, ics); // TODO: impl
    }
    spectral_data(bitView, ics); // TODO: impl
}

function section_data(bitView, ics) {
    var sect_esc_val  = 0; // 7(3bit) or 31(5bit)
    var sect_len_bits = 0; // 3 bits or 5 bits
    var sect_len_incr = 0;
    var sect_cb       = [];
    var sect_start    = [];
    var sect_end      = [];
    var sfb_cb        = [];
    var num_sec       = [];

    if (ics.window_sequence === EIGHT_SHORT_SEQUENCE) {
        sect_esc_val = (1 << 3) - 1; // 7
        sect_len_bits = 3;
    } else {
        sect_esc_val = (1 << 5) - 1; // 31
        sect_len_bits = 5;
    }
    for (var g = 0; g < num_window_groups; g++) { // TBD: num_window_groups
        var k = 0;
        var i = 0;

        sect_cb[g]    = [];
        sect_start[g] = [];
        sect_end[g]   = [];
        sfb_cb[g]     = [];

        while (k < max_sfb) {
            sect_cb[g][i] = bitView["u"](4);
            var sect_len = 0;
            while ((sect_len_incr = bitView["u"](sect_len_bits)) === sect_esc_val) { // read 3bits or 5bits
                sect_len += sect_esc_val;
            }
            sect_len += sect_len_incr;
            sect_start[g][i] = k;
            sect_end[g][i]   = k + sect_len;
            for (var sfb = k; sfb < k + sect_len; sfb++) {
                sfb_cb[g][sfb] = sect_cb[g][i];
            }
            k += sect_len;
            i++;
        }
        num_sec[g] = i;
    }
    // extend ics info
  //ics.sect_esc_val  = sect_esc_val;
  //ics.sect_len_bits = sect_len_bits;
  //ics.sect_len_incr = sect_len_incr;
    ics.sect_cb       = sect_cb;
    ics.sect_start    = sect_start;
    ics.sect_end      = sect_end;
    ics.sfb_cb        = sfb_cb;
    ics.num_sec       = num_sec;
}

function scale_factor_data(bitView, ics) {
    // Table B.1 – Extended syntax for scale_factor_data()
    // https://github.com/mstorsjo/fdk-aac/blob/15b128dd826ba86ee962d86b0b06966a25ed9158/libAACdec/src/block.cpp#L160
    var noise_pcm_flag = 1;
    for (var g = 0; g < ics.num_window_groups; g++) { // TODO: ics.num_window_groups
        for (var sfb = 0; sfb < ics.max_sfb; sfb++) {
            if (ics.sfb_cb[g][sfb] !== ZERO_HCB) {
                if (is_intensity(g, sfb)) { // impl

// Huffman codeword from the Huffman code Table used for coding of scalefactors (see subclause 6.3, Table 18).
// Huffman codeword from the Huffman code Table used for coding of scalefactors, see Table 18 and subclause 9.2

                    hcod_sf[dpcm_is_position[g][sfb]] = bitView["u"](1..19); // TODO:
                } else if (sfb_cb[g][sfb] === 13) {
                    if (noise_pcm_flag) {
                        noise_pcm_flag = 0;
                        dpcm_noise_nrg[g][sfb] = bitView["u"](9);
                    } else {
                        hcod_sf[dpcm_noise_nrg[g][sfb]] = bitView["u"](1..19); // TODO:
                    }
                } else {
                    hcod_sf[dpcm_sf[g][sfb]] = bitView["u"](1..19); // TODO:
                }
            }
        }
    }
}

function is_intensity(group,sfb) {
    INTENSITY_HCB = 15
    INTENSITY_HCB2 = 14



    // Function returning the intensity status, defined in 12.2.3
    +1 for window groups / scalefactor bands with right channel codebook
    sfb_cb[group][sfb] == INTENSITY_HCB
    -1 for window groups / scalefactor bands with right channel codebook
    sfb_cb[group][sfb] == INTENSITY_HCB2 0 otherwise
}

function channel_pair_element(bitView, frame) {
    var element_instance_tag = bitView["u"](4);
    var common_window = bitView["u"](1);
    var ms_used = [];

    if (common_window) {
        var ics = ics_info(bitView, frame["samplingRate"]);
        var ms_mask_present = bitView["u"](2);

        if (ms_mask_present === 1) {
            // TODO impl!! bitView["skip"](ics.num_window_groups * ics.max_sfb);
            //for (var g = 0; g < ics.num_window_groups; g++) {
            //    for (var sfb = 0; sfb < ics.max_sfb; sfb++) {
            //        ms_used[g][sfb] = bitView["u"](1);
            //    }
            //}
            for (var g = 0; g < ics.num_window_groups; g++) {
                ms_used[g] = [];
                for (var sfb = 0; sfb < ics.max_sfb; sfb++) {
                    ms_used[g][sfb] = bitView["u"](1);
                }
            }
        }
    }
    individual_channel_stream(common_window);
    individual_channel_stream(common_window);
}

function ics_info(bitView,        // @arg BitView
                  samplingRate) { // @arg UINT32
                                  // @ret Object
    var ics_reserved_bit                = bitView["u"](1);
    var window_sequence                 = bitView["u"](2);
    var window_shape                    = bitView["u"](1);
    var max_sfb                         = 0;
    var scale_factor_grouping           = 0;
    var predictor_data_present          = 0;
    var predictor_reset                 = 0;
    var predictor_reset_group_number    = 0;
    var prediction_used                 = [];

    if (window_sequence === EIGHT_SHORT_SEQUENCE) {
        max_sfb                 = bitView["u"](4);
        scale_factor_grouping   = bitView["u"](7);
    } else {
        max_sfb                 = bitView["u"](6);
        predictor_data_present  = bitView["u"](1);

        if (predictor_data_present) {
            predictor_reset     = bitView["u"](1);
            if (predictor_reset) {
                predictor_reset_group_number = bitView["u"](5);
            }
            var PRED_SFB_MAX = PRED_SFB_MAX_TABLE[samplingRate];
            for (var sfb = 0, sfbz = Math.min(max_sfb, PRED_SFB_MAX); sfb < sfbz; ++sfb) {
                prediction_used[sfb] = bitView["u"](1);
            }
        }
    }
    return {
        ics_reserved_bit:               ics_reserved_bit,
        window_sequence:                window_sequence,
        window_shape:                   window_shape,
        max_sfb:                        max_sfb,
        scale_factor_grouping:          scale_factor_grouping,
        predictor_data_present:         predictor_data_present,
        predictor_reset:                predictor_reset,
        predictor_reset_group_number:   predictor_reset_group_number,
        prediction_used:                prediction_used,
    };
}
 */

return ADTSRawDataBlocks; // return entity

});

