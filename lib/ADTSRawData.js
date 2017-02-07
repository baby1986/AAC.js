(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("ADTSRawData", function moduleClosure(global, WebModule, VERIFY, VERBOSE) {
"use strict";

// --- technical terms / data structure --------------------
/*
- TechnicalTerms
    - https://github.com/uupaa/AAC.js/wiki/TechnicalTerms

- ADTSRawDataObject: { elements, encoder }
    - elements: ObjectArray
    - encoder:  String - "", "Lavc"

| Audio Object Type | Object Type ID |
|-------------------|----------------|
| AAC-LC            | 2              |
| HE-AAC v1 (SBR)   | 5              |
| HE-AAC v2 (PS)    | 29             |
*/

//var AUDIO_OBJECT_TYPE_AAC_LC    = 2;
//var AUDIO_OBJECT_TYPE_HE_AAC_V1 = 5;
//var AUDIO_OBJECT_TYPE_HE_AAC_V2 = 29;

// --- dependency modules ----------------------------------
var BitView = WebModule["BitView"];
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
var ID_SCE = 0x0; // single_channel_element()
var ID_CPE = 0x1; // channel_pair_element()
//var ID_CCE = 0x2; // coupling_channel_element()
//var ID_LFE = 0x3; // lfe_channel_element()
//var ID_DSE = 0x4; // data_stream_element()
//var ID_PCE = 0x5; // program_config_element()
var ID_FIL = 0x6; // fill_element()
var ID_END = 0x7; // TERM

//var EXT_FILL          = 0x0; // '0000' Bitstream filler
var EXT_FILL_DATA     = 0x1; // '0001' Bitstream data as filler
var EXT_DYNAMIC_RANGE = 0xB; // '1011' Dynamic range control
var EXT_SBR_DATA      = 0xD; // '1101' SBR enhancement
var EXT_SBR_DATA_CRC  = 0xE; // '1110' SBR enhancement with CRC

//var ONLY_LONG_SEQUENCE   = 0; // LONG_WINDOW (num_windows = 1)
//var LONG_START_SEQUENCE  = 1; // LONG_START_WINDOW (num_windows = 1)
var EIGHT_SHORT_SEQUENCE = 2; // 8 * SHORT_WINDOW (num_windows = 8)
//var LONG_STOP_SEQUENCE   = 3; // LONG_STOP_WINDOW (num_windows = 1)

var PRED_SFB_MAX_TABLE = {
  //SampleRate  PRED_SFB_MAX
    48000:      40,
    44100:      40,
    24000:      41,
    22050:      41,
};

// --- class / interfaces ----------------------------------
var ADTSRawData = {
    "VERBOSE":      VERBOSE,
    "parse":        ADTSRawData_parse, // ADTSRawData.parse(adts:ADTSObject, source:Uint8Array, options:Object = null):ADTSRawDataObject
};

// --- implements ------------------------------------------
function ADTSRawData_parse(adts,      // @arg ADTSObject
                           source,    // @arg Uint8Array - raw level byte stream.
                           options) { // @arg Object - { maxElements }
                                      // @options.maxElements UINT8 = 0
                                      // @ret ADTSRawDataObject - { elements, encoder }
//{@dev
    if (VERIFY) {
        $valid($type(adts,    "ADTSObject"),  ADTSRawData_parse, "adts");
        $valid($type(source,  "Uint8Array"),  ADTSRawData_parse, "source");
        $valid($type(options, "Object|omit"), ADTSRawData_parse, "options");
        if (options) {
            $valid($keys(options, "maxElements"), ADTSRawData_parse, "options");
            $valid($type(options.maxElements, "UINT8|omit"), ADTSRawData_parse, "options.maxElements");
        }
    }
//}@dev

    options = options || {};
    var maxElements = options["maxElements"] || 0;

    var rawData = { "elements": [], "encoder": "" };

    for (var i = 0, iz = adts["frames"].length; i < iz; ++i) {
        var adtsFrame = adts["frames"][i];
        var bitView   = new BitView(source.subarray(adtsFrame["rawDataBlockStart"],
                                                    adtsFrame["rawDataBlockEnd"]));
        raw_data_block(bitView, adts, rawData, maxElements);
    }
    return rawData;
}

function raw_data_block(bitView, adts, rawData, maxElements) {
    // version 2005
    var id = 0;

    while ( (id = bitView["u"](3)) !== ID_END ) { // id_syn_ele
        var param = _initParam();
        switch (id) {
        case ID_SCE:    single_channel_element(bitView, adts, param); break;
        case ID_CPE:    channel_pair_element(bitView, adts, param); break;
      //case ID_CCE:    coupling_channel_element(bitView, adts, param); break;
      //case ID_LFE:    lfe_channel_element(bitView, adts, param); break;
      //case ID_DSE:    data_stream_element(bitView, adts, param); break;
      //case ID_PCE:    program_config_element(bitView, adts, param); break;
        case ID_FIL:    fill_element(bitView, adts, param);
                        rawData["elements"].push({ "type": "fill", "data": param.other_bits });
                        _detectEncoder(rawData, param.other_bits);
                        break;
        default: console.warn("NOT_IMPL", id);
        }
        if (maxElements && rawData["elements"].length >= maxElements) {
            break;
        }
    }
    byte_alignment(bitView);
}

function _initParam() {
    return {
        ics_reserved_bit:       0,
        window_sequence:        0,
        window_shape:           0,
        max_sfb:                0,
        scale_factor_grouping:  0,
        predictor_reset_group_number: 0,
        prediction_used:        [],
        num_window_groups:      1,
        ms_used:                [], // channel_pair_element()
        other_bits:             [], // fill_element()
        sect_cb:                [], // section_data()
        sect_start:             [], // section_data()
        sect_end:               [], // section_data()
        sfb_cb:                 [], // section_data()
        num_sec:                [], // section_data()
        n_filt:                 [], // tns_data()
        coef_res:               [], // tns_data()
        length:                 [], // tns_data()
        order:                  [], // tns_data()
        direction:              [], // tns_data()
        coef_compress:          [], // tns_data()
        coef:                   [], // tns_data()
        pulse_start_sfb:        0,  // pulse_data()
        pulse_offset:           [], // pulse_data()
        pulse_amp:              [], // pulse_data()
        sect_sfb_offset:        [], // spectral_data()
        unsigned_cb:            [], // spectral_data()
        quad_sign_bits:         0,  // spectral_data()
        pair_sign_bits:         0,  // spectral_data()
        hcod_esc_y:             0,  // spectral_data()
        hcod_esc_z:             0,  // spectral_data()
        adjust_num:             [], // gain_control_data()
        alevcode:               [], // gain_control_data()
        aloccode:               [], // gain_control_data()
        global_gain:            0,  // individual_channel_stream()
    };
}

function _detectEncoder(rawData, // @arg Object - { elements, encoder }
                        bits) {  // @arg BitNumberArray - [0 or 1, ...]
    // mac で ffmpeg -i a.wav a.m4a か ffmpeg -i a.wav a.aac を行うと
    // AAC の fill_element を利用して encoder名 "Lavc57.24.102" が meta data の形で埋め込まれる
    // 先頭の5 bitを捨て末尾の0x00までを文字列として取り出し、既知のエンコーダー名と比較する
    var ascii = [];
    var n = 0;

    for (var i = 5, iz = bits.length; i < iz; i += 8) {
        n = 0;
        for (var j = 0; j < 8; ++j) {
            n = (n << 1) | bits[i + j];
        }
        ascii.push(n);
    }
    var maybeEncoderName = String.fromCharCode.apply(null, ascii);

    if (/^Lavc/i.test(maybeEncoderName)) { // "Lavc57.24.102"
        rawData["encoder"] = "Lavc";
    }
}

function single_channel_element(bitView, adts, param) {
    // version 2005
  //var element_instance_tag = bitView["u"](4);
    bitView["u"](4);
    individual_channel_stream(bitView, adts, param, 0);
}

function channel_pair_element(bitView, adts, param) {
    // version 2005
  //var element_instance_tag = bitView["u"](4);
    bitView["u"](4);
    var common_window        = bitView["u"](1);

    param.ms_used = [];
    if (common_window) {
        ics_info(bitView, adts, param);
        var ms_mask_present  = bitView["u"](2);
        if (ms_mask_present === 1) {
            for (var g = 0; g < param.num_window_groups; g++) {
                param.ms_used[g] = [];
                for (var sfb = 0; sfb < param.max_sfb; sfb++) {
                    param.ms_used[g][sfb] = bitView["u"](1);
                }
            }
        }
    }
    individual_channel_stream(bitView, adts, param, common_window);
    individual_channel_stream(bitView, adts, param, common_window);
}

function fill_element(bitView, adts, param) {
    // version 2005
    var count = bitView["u"](4);
    var cnt = count;

    if (cnt === 15) {
        var esc_count = bitView["u"](8);
        cnt += esc_count - 1;
    }
    while (cnt > 0) {
        cnt -= extension_payload(bitView, cnt);
    }

    function extension_payload(bitView, cnt) {
        // version 2005
        var extension_type = bitView["u"](4);
        var i = 0;

        switch (extension_type) {
        case EXT_DYNAMIC_RANGE:
          //return dynamic_range_info(bitView); // TODO: impl
            return cnt; // TODO: delete this line
        case EXT_SBR_DATA:
          //return sbr_extension_data(bitView, id_aac, 0); // TODO: impl
            return cnt; // TODO: delete this line
        case EXT_SBR_DATA_CRC:
          //return sbr_extension_data(bitView, id_aac, 1); // TODO: impl
            return cnt; // TODO: delete this line
        case EXT_FILL_DATA:
          /*var fill_nibble = */ bitView["u"](4); // must be '0000'
          /*var fill_byte = [];*/
            for (i = 0; i < cnt - 1; i++) {
              /*fill_nibble = */ bitView["u"](8); // must be '10100101
            }
            return cnt;
        default:
            for (i = 0; i < 8 * (cnt - 1) + 4; i++) {
                var n = bitView["u"](1);
                param.other_bits.push(n);
            }
            return cnt;
        }
    }
}

/*
function program_config_element(bitView,
                                calledInAudioSpecificConfig) { // @arg Boolean
    var element_instance_tag        = bitView["u"](4);
    var object_type                 = bitView["u"](2);
    var sampling_frequency_index    = bitView["u"](4);
    var num_front_channel_elements  = bitView["u"](4);
    var num_side_channel_elements   = bitView["u"](4);
    var num_back_channel_elements   = bitView["u"](4);
    var num_lfe_channel_elements    = bitView["u"](2);
    var num_assoc_data_elements     = bitView["u"](3);
    var num_valid_cc_elements       = bitView["u"](4);
    var mono_mixdown_present        = bitView["u"](1);
    var mono_mixdown_element_number = 0;
    var stereo_mixdown_element_number = 0;
    var pseudo_surround_enable = 0;

    if (mono_mixdown_present === 1) {
        mono_mixdown_element_number = bitView["u"](4);
    }
    var stereo_mixdown_present      = bitView["u"](1);
    if (stereo_mixdown_present === 1) {
        stereo_mixdown_element_number = bitView["u"](4);
    }
    var matrix_mixdown_idx_present  = bitView["u"](1);
    if (matrix_mixdown_idx_present === 1) {
        matrix_mixdown_idx          = bitView["u"](2);
        pseudo_surround_enable      = bitView["u"](1);
    }
    var front_element_is_cpe = [];
    var front_element_tag_select = [];
    for (var i = 0; i < num_front_channel_elements; i++) {
        front_element_is_cpe[i]     = bitView["u"](1);
        front_element_tag_select[i] = bitView["u"](4);
    }
    var side_element_is_cpe = [];
    var side_element_tag_select = [];
    for (i = 0; i < num_side_channel_elements; i++) {
        side_element_is_cpe[i]      = bitView["u"](1);
        side_element_tag_select[i]  = bitView["u"](4);
    }
    var back_element_is_cpe = [];
    var back_element_tag_select = [];
    for (i = 0; i < num_back_channel_elements; i++) {
        back_element_is_cpe[i]      = bitView["u"](1);
        back_element_tag_select[i]  = bitView["u"](4);
    }
    var lfe_element_tag_select = [];
    for (i = 0; i < num_lfe_channel_elements; i++) {
        lfe_element_tag_select[i]   = bitView["u"](4);
    }
    var assoc_data_element_tag_select = [];
    for ( i = 0; i < num_assoc_data_elements; i++) {
        assoc_data_element_tag_select[i] = bitView["u"](4);
    }
    var cc_element_is_ind_sw = [];
    var valid_cc_element_tag_select = [];
    for (i = 0; i < num_valid_cc_elements; i++) {
        cc_element_is_ind_sw[i]     = bitView["u"](1);
        valid_cc_element_tag_select[i] = bitView["u"](4);
    }
    if (calledInAudioSpecificConfig) {
        byte_alignment(bitView);
    }
    var comment_field_bytes         = bitView["u"](8);
    var comment_field_data = [];
    for (i = 0; i < comment_field_bytes; i++) {
        comment_field_data[i]       = bitView["u"](8);
    }
}
 */

function ics_info(bitView, adts, param) {
    // version 2005
    var PRED_SFB_MAX                = PRED_SFB_MAX_TABLE[ adts["samplingRate"] ];
    var ics_reserved_bit            = bitView["u"](1);
    var window_sequence             = bitView["u"](2);
    var window_shape                = bitView["u"](1);
    var max_sfb                     = 0;
    var scale_factor_grouping       = 0;
    var predictor_reset_group_number = 0;
    var prediction_used             = [];
    if (window_sequence === EIGHT_SHORT_SEQUENCE) {
        max_sfb                     = bitView["u"](4);
        scale_factor_grouping       = bitView["u"](7);
    } else {
        max_sfb                     = bitView["u"](6);
        var predictor_data_present  = bitView["u"](1);
        if (predictor_data_present) {
            var predictor_reset = bitView["u"](1);
            if (predictor_reset) {
                predictor_reset_group_number = bitView["u"](5);
            }
            for (var sfb = 0; sfb < Math.min(max_sfb, PRED_SFB_MAX); sfb++) {
                prediction_used[sfb] = bitView["u"](1);
            }
        }
    }

    param.ics_reserved_bit              = ics_reserved_bit;
    param.window_sequence               = window_sequence;
    param.window_shape                  = window_shape;
    param.max_sfb                       = max_sfb;
    param.scale_factor_grouping         = scale_factor_grouping;
    param.predictor_reset_group_number  = predictor_reset_group_number;
    param.prediction_used               = prediction_used;
}

/*
function coupling_channel_element(bitView, adts, param) {
    var element_instance_tag        = bitView["u"](4);
    var ind_sw_cce_flag             = bitView["u"](1);
    var num_coupled_elements        = bitView["u"](3);
    var num_gain_element_lists      = 0;
    var cc_target_is_cpe            = [];
    var cc_target_tag_select        = [];
    var cc_l                        = [];
    var cc_r                        = [];
    for (var c = 0; c < num_coupled_elements+1; c++) {
        num_gain_element_lists++;
        cc_target_is_cpe[c]         = bitView["u"](1);
        cc_target_tag_select[c]     = bitView["u"](4);
        if (cc_target_is_cpe[c]) {
            cc_l[c]                 = bitView["u"](1);
            cc_r[c]                 = bitView["u"](1);
            if (cc_l[c] && cc_r[c]) {
                num_gain_element_lists++;
            }
        }
    }
    var cc_domain                   = bitView["u"](1);
    var gain_element_sign           = bitView["u"](1);
    var gain_element_scale          = bitView["u"](2);

    individual_channel_stream(bitView, adts, param, 0, 0);
    var common_gain_element_present = [];
    var cge = 0;
    var hcod_sf = [];
    var common_gain_element = [];
    var dpcm_gain_element = [[[]]];

    for (c = 1; c < num_gain_element_lists; c++) {
        if (ind_sw_cce_flag) {
            cge = 1;
        } else {
            common_gain_element_present[c] = bitView["u"](1);
            cge = common_gain_element_present[c];
        }
        //if (cge) {
        //    hcod_sf[common_gain_element[c]] = bitView["u"](1..19); // 1..19 vlclbf
        //} else {
        //    for (var g = 0; g < param.num_window_groups; g++) {
        //        for (sfb = 0; sfb < max_sfb; sfb++) {
        //            if (sfb_cb[g][sfb] !== ZERO_HCB) {
        //                hcod_sf[dpcm_gain_element[c][g][sfb]] = bitView["u"](1..19); // vlclbf
        //            }
        //        }
        //    }
        //}
    }
}
 */

function individual_channel_stream(bitView, adts, param, common_window) {
    // version 2005
    param.global_gain = bitView["u"](8);
    if (!common_window) {
        ics_info(bitView, adts, param);
    }
    section_data(bitView, adts, param);
    scale_factor_data(bitView, adts, param);

    var pulse_data_present = bitView["u"](1);
    if (pulse_data_present) {
        pulse_data(bitView);
    }
    var tns_data_present = bitView["u"](1);
    if (tns_data_present) {
        tns_data(bitView);
    }
    var gain_control_data_present = bitView["u"](1);
    if (gain_control_data_present) {
        gain_control_data(bitView); // TODO:
    }
    spectral_data(bitView); // TODO:
}

function section_data(/* bitView, adts, param */) {
    // version 2005
/*
    var sect_esc_val = 0;
    var readBits = null;
    if (param.window_sequence === EIGHT_SHORT_SEQUENCE) {
        sect_esc_val = (1 << 3) - 1;
        readBits = function() { return bitView["u"](3); };
    } else {
        sect_esc_val = (1 << 5) - 1;
        readBits = function() { return bitView["u"](5); };
    }

    param.sect_cb    = [];
    param.sect_start = [];
    param.sect_end   = [];
    param.sfb_cb     = [];
    for (var g = 0; g < param.num_window_groups; g++) {
        var k = 0;
        var i = 0;
        param.sect_cb[g]    = [];
        param.sect_start[g] = [];
        param.sect_end[g]   = [];
        param.sfb_cb[g]     = [];
        while (k < param.max_sfb) {
            sect_cb[g][i] = bitView["u"](4);
            var sect_len = 0;
            while ((sect_len_incr = readBits()) === sect_esc_val) { // {3;5} uimsbf
                sect_len += sect_esc_val;
            }
            sect_len += sect_len_incr;
            sect_start[g][i] = k;
            sect_end[g][i] = k + sect_len;
            for (sfb = k; sfb < k + sect_len; sfb++) {
                sfb_cb[g][sfb] = sect_cb[g][i];
            }
            k += sect_len;
            i++;
        }
        param.num_sec[g] = i;
    }
 */
}

function scale_factor_data(/* bitView, adts, param */) {
    // version 2005
/*
    for (var g = 0; g < param.num_window_groups; g++) {
        for (var sfb = 0; sfb < param.max_sfb; sfb++) {
            if (param.sfb_cb[g][sfb] !== ZERO_HCB) { // TODO: ZERO_HCB
                if (is_intensity(g,sfb)) { // TODO: is_intensity
                    hcod_sf[dpcm_is_position[g][sfb]]; // 1..19 vlclbf // TODO: hcod_sf, dpcm_is_position
                } else {
                    hcod_sf[dpcm_sf[g][sfb]]; // 1..19 vlclbf // TODO:
                }
            }
        }
    }
 */
}

function pulse_data(/* bitView, adts, param */) {
    // version 2005
/*
    var number_pulse            = bitView["u"](2);
    param.pulse_start_sfb       = bitView["u"](6);
    for (var i = 0; i < number_pulse + 1; i++) {
        param.pulse_offset[i]   = bitView["u"](5);
        param.pulse_amp[i]      = bitView["u"](4);
    }
 */
}

function tns_data(/* bitView, adts, param */) {
    // version 2005

    // | Name   | Window with 128 spectral lines | Other window size |
    // |--------|--------------------------------|-------------------|
    // | n_filt | 1                              | 2                 |
    // | length | 4                              | 6                 |
    // | order  | 3                              | 5                 |
/*
    var ie8    = param.window_sequence === EIGHT_SHORT_SEQUENCE;
    var n_filt_len = ie8 ? 1 : 2;
    var length_len = ie8 ? 4 : 6;
    var order_len  = ie8 ? 3 : 5;

    param.n_filt = [];
    param.coef_res = [];
    for (var w = 0; w < param.num_windows; w++) {
        param.n_filt[w] = bitView["u"](n_filt_len); // 1..2
        if (param.n_filt[w]) {
            param.coef_res[w] = bitView["u"](1);
        }
        for (var filt = 0; filt < param.n_filt[w]; filt++) {
            param.length[w][filt] = bitView["u"](length_len); // {4;6}
            param.order[w][filt]  = bitView["u"](order_len);  // {3;5}
            if (param.order[w][filt]) {
                param.direction[w][filt]     = bitView["u"](1);
                var coef_compress            = bitView["u"](1);
                param.coef_compress[w][filt] = coef_compress;
                var coef_len = param.coef_res[w] + 3 - coef_compress; // TODO: this line is not clear
                for (var i = 0; i < param.order[w][filt]; i++) {
                    param.coef[w][filt][i]   = bitView["u"](coef_len); // 2..4
                }
            }
        }
    }
 */
}

function gain_control_data(/* bitView, adts, param */) {
    // version 2005
/*
    var bd = 0, wd = 0, ad = 0;
    var max_band = bitView["u"](2);
    param.adjust_num = [];
    param.alevcode   = [];
    param.aloccode   = [];
    if (param.window_sequence === ONLY_LONG_SEQUENCE) {
        for (bd = 1; bd <= max_band; bd++) {
            param.adjust_num[bd] = [];
            param.alevcode[bd]   = [];
            param.aloccode[bd]   = [];
            for (wd = 0; wd < 1; wd++) {
                param.adjust_num[bd][wd] = bitView["u"](3);
                param.alevcode[bd][wd] = [];
                param.aloccode[bd][wd] = [];
                for (ad = 0; ad < param.adjust_num[bd][wd]; ad++) {
                    param.alevcode[bd][wd][ad] = bitView["u"](4);
                    param.aloccode[bd][wd][ad] = bitView["u"](5);
                }
            }
        }
    } else if (param.window_sequence === LONG_START_SEQUENCE) {
        for (bd = 1; bd <= max_band; bd++) {
            for (wd = 0; wd < 2; wd++) {
                param.adjust_num[bd][wd] = bitView["u"](3);
                param.alevcode[bd][wd] = [];
                param.aloccode[bd][wd] = [];
                for (ad = 0; ad < adjust_num[bd][wd]; ad++) {
                    param.alevcode[bd][wd][ad] = bitView["u"](4);
                    if (wd == 0) {
                        param.aloccode[bd][wd][ad] = bitView["u"](4);
                    } else {
                        param.aloccode[bd][wd][ad] = bitView["u"](2);
                    }
                }
            }
        }
    } else if (param.window_sequence === EIGHT_SHORT_SEQUENCE) {
        for (bd = 1; bd <= max_band; bd++) {
            for (wd = 0; wd < 8; wd++) {
            param.adjust_num[bd][wd] = bitView["u"](3);
            param.alevcode[bd][wd] = [];
            param.aloccode[bd][wd] = [];
            for (ad = 0; ad < adjust_num[bd][wd]; ad++) {
                param.alevcode[bd][wd][ad] = bitView["u"](4);
                param.aloccode[bd][wd][ad] = bitView["u"](2);
            }
        }
    } else if (param.window_sequence === LONG_STOP_SEQUENCE) {
        for (bd = 1; bd <= max_band; bd++) {
            for (wd = 0; wd < 2; wd++) {
                param.adjust_num[bd][wd] = bitView["u"](3);
                param.alevcode[bd][wd] = [];
                param.aloccode[bd][wd] = [];
                for (ad = 0; ad < adjust_num[bd][wd]; ad++) {
                    param.alevcode[bd][wd][ad] = bitView["u"](4);
                    if (wd === 0) {
                        param.aloccode[bd][wd][ad] = bitView["u"](4);
                    } else {
                        param.aloccode[bd][wd][ad] = bitView["u"](5);
                    }
                }
            }
        }
    }
 */
}

function spectral_data(/* bitView, adts, param */) {
    // version 2005
/*
    for (var g = 0; g < param.num_window_groups; g++) {
        for (var i = 0; i < param.num_sec[g]; i++) {
            if (param.sect_cb[g][i] !== ZERO_HCB && param.sect_cb[g][i] <= ESC_HCB) {
                for (var k = param.sect_sfb_offset[g][param.sect_start[g][i]];
                     k < sect_sfb_offset[g][sect_end[g][i]]; ) {
                    if (param.sect_cb[g][i] < FIRST_PAIR_HCB) {
                        hcod[sect_cb[g][i]][w][x][y][z] = bitView["u"](1..16);
                        if (param.unsigned_cb[param.sect_cb[g][i]]) {
                            param.quad_sign_bits = bitView["u"](0..4);
                        }
                        k += QUAD_LEN;
                    } else {
                        hcod[param.sect_cb[g][i]][y][z] = bitView["u"](1..15);
                        if (param.unsigned_cb[param.sect_cb[g][i]]) {
                            param.pair_sign_bits = bitView["u"](0..2);
                        }
                        k += PAIR_LEN;
                        if (param.sect_cb[g][i] === ESC_HCB) {
                            if (y === ESC_FLAG) {
                                param.hcod_esc_y = bitView["u"](5..21);
                            }
                            if (z === ESC_FLAG) {
                                param.hcod_esc_z = bitView["u"](5..21);
                            }
                        }
                    }
                }
            }
        }
    }
 */
}

function byte_alignment(bitView) {
    bitView["byteAlign"]();
}

return ADTSRawData; // return entity

});

