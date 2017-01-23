var ModuleTestAAC = (function(global) {

var test = new Test(["AAC"], { // Add the ModuleName to be tested here (if necessary).
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     false,  // enable worker test.
        node:       false,  // enable node test.
        nw:         true,  // enable nw.js test.
        el:         true,  // enable electron (render process) test.
        button:     true,  // show button.
        both:       false,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
            console.error(error.message);
        }
    });

if (IN_BROWSER || IN_NW || IN_EL) {
    test.add([
        testAAC_AAC_44100_LR_2,
        testAAC_AAC_44100_LR_5,
        testAAC_AAC_44100_LR_29,
        testAAC_AAC_LC_parse,
        testAAC_toBlob,
        testADTSRawData_detectEncoder,
    ]);
}

// --- test cases ------------------------------------------
function testAAC_AAC_44100_LR_2(test, pass, miss) {
    var adts = ADTS.parse(AAC.AAC_44100_LR_2);
    var f0   = adts.frames[0];

    console.dir(adts);
    console.dir(f0);

    var audioContext = global["AudioContext"] ? new AudioContext() : new webkitAudioContext();

    if (adts.errorBytes === 0 && f0.error === false) {
        if (adts.duration) {
            if (adts.frames.length === 2) {
                if (f0.mpegVersion === 4) {
                    if (f0.crcProtection === false) {
                        if (f0.audioObjectType === 2) {
                            if (f0.samplingRate === 44100) {
                                if (f0.channels === 2) {
                                    if (f0.adtsFrameLength === 139) {
                                        if (f0.adtsHeaderLength === 7) {
                                            if (f0.crcLength === 0) {
                                                if (f0.rawDataBlockEnd - f0.rawDataBlockStart === 139 - 7) {
                                                    audioContext.decodeAudioData(AAC.AAC_44100_LR_2.buffer, function(audioBuffer) { // @arg AudioBuffer - PCM data
                                                        var pcm = audioBuffer.getChannelData(0); // Float32Array(2048)

                                                        if (pcm.length === 2048) {
                                                            if (Math.max.apply(null, pcm) === 0) {
                                                                if (Math.min.apply(null, pcm) === 0) {
                                                                    test.done(pass());
                                                                    return;
                                                                }
                                                            }
                                                        }
                                                        test.done(miss());
                                                    }, function(error) {
                                                        test.done(miss());
                                                    });
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    test.done(miss());
}

function testAAC_AAC_44100_LR_5(test, pass, miss) {
    var adts = ADTS.parse(AAC.AAC_44100_LR_5);
    var f0   = adts.frames[0];

    console.dir(adts);
    console.dir(f0);

    var audioContext = global["AudioContext"] ? new AudioContext() : new webkitAudioContext();

    if (adts.errorBytes === 0 && f0.error === false) {
        if (adts.duration) {
            if (adts.frames.length === 1) {
                if (f0.mpegVersion === 4) {
                    if (f0.crcProtection === false) {
                        if (f0.audioObjectType === 2) {
                            if (f0.samplingRate === 22050) { // 44100 / 2 = 22050
                                if (f0.channels === 2) { // L/R
                                    if (f0.adtsFrameLength === 278) {
                                        if (f0.adtsHeaderLength === 7) {
                                            if (f0.crcLength === 0) {
                                                if (f0.rawDataBlockEnd - f0.rawDataBlockStart === 278 - 7) {
                                                    audioContext.decodeAudioData(AAC.AAC_44100_LR_5.buffer, function(audioBuffer) { // @arg AudioBuffer - PCM data
                                                        var pcm = audioBuffer.getChannelData(0); // Float32Array(2048)
                                                        var max = Math.max.apply(null, pcm);
                                                        var min = Math.min.apply(null, pcm);

                                                        if (pcm.length === 2048) {
                                                            if (max <= 1 && min >= -1) {
                                                                test.done(pass());
                                                                return;
                                                            }
                                                        }
                                                        test.done(miss());
                                                    }, function(error) {
                                                        test.done(miss());
                                                    });
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    test.done(miss());
}


function testAAC_AAC_44100_LR_29(test, pass, miss) {
    var adts = ADTS.parse(AAC.AAC_44100_LR_29);
    var f0   = adts.frames[0];

    console.dir(adts);
    console.dir(f0);

    var audioContext = global["AudioContext"] ? new AudioContext() : new webkitAudioContext();

    if (adts.errorBytes === 0 && f0.error === false) {
        if (adts.duration) {
            if (adts.frames.length === 1) {
                if (f0.mpegVersion === 4) {
                    if (f0.crcProtection === false) {
                        if (f0.audioObjectType === 2) {
                            if (f0.samplingRate === 22050) { // 44100 / 2 = 22050
                                if (f0.channels === 1) { // mono
                                    if (f0.adtsFrameLength === 278) {
                                        if (f0.adtsHeaderLength === 7) {
                                            if (f0.crcLength === 0) {
                                                if (f0.rawDataBlockEnd - f0.rawDataBlockStart === 278 - 7) {
                                                    audioContext.decodeAudioData(AAC.AAC_44100_LR_29.buffer, function(audioBuffer) { // @arg AudioBuffer - PCM data
                                                        var pcm = audioBuffer.getChannelData(0); // Float32Array(2048)
                                                        var max = Math.max.apply(null, pcm);
                                                        var min = Math.min.apply(null, pcm);

                                                        if (pcm.length === 2048) {
                                                            if (max <= 1 && min >= -1) {
                                                                test.done(pass());
                                                                return;
                                                            }
                                                        }
                                                        test.done(miss());
                                                    }, function(error) {
                                                        test.done(miss());
                                                    });
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    test.done(miss());
}


function testAAC_AAC_LC_parse(test, pass, miss) {
    var file = "../assets/sin0.aac";

    FileLoader.toArrayBuffer(file, function(arrayBuffer) {

        var byteStream = new Uint8Array(arrayBuffer);
        var adts       = ADTS.parse(byteStream);
        var f0         = adts.frames[0];

        console.dir(adts);
        console.dir(f0);

        // $ afinfo -r v0.aac
        // File:           v0.aac
        // File type ID:   adts
        // Num Tracks:     1
        // ----
        // Data format:     2 ch,  44100 Hz, 'aac ' (0x00000000) 0 bits/channel, 0 bytes/packet, 1024 frames/packet, 0 bytes/frame
        // Channel layout: Stereo (L R)
        // audio bytes: 300385
        // audio packets: 2156
        // estimated duration: 50.062 sec
        // bit rate: 48001 bits per second
        // packet size upper bound: 1536
        // maximum packet size: 159
        // audio data file offset: 0
        // optimized
        // format list:
        // [ 0] format:	  2 ch,  44100 Hz, 'aac ' (0x00000000) 0 bits/channel, 0 bytes/packet, 1024 frames/packet, 0 bytes/frame
        // Channel layout: Stereo (L R)
        if (arrayBuffer.byteLength === 300385) { // (audio bytes)
            if (adts.duration >= 50.062) { // $ afinfo -r v0.aac -> 50.062
                if (adts.contamination === false) {
                    if (adts.errorBytes === 0) {
                        if (adts.frames.length === 2156) { // (audio packtes)
                            if (f0.mpegVersion === 4) {
                                if (f0.crcProtection === false) {
                                    if (f0.audioObjectType === 2) {
                                        if (f0.samplingRate === 44100) {
                                            if (f0.channels === 2) {
                                                if (f0.adtsFrameLength === 139) {
                                                    if (f0.adtsHeaderLength === 7) {
                                                        if (f0.crcLength === 0) {
                                                            if (f0.rawDataBlockEnd - f0.rawDataBlockStart === 139 - 7) {
                                                                test.done(pass());
                                                                return;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        test.done(miss());

    }, function(error) {
        console.error(error.message);
        test.done(miss());
    });
}

function testAAC_toBlob(test, pass, miss) {
    var file = "../assets/sin2.aac"; // HE-AAC v2
/*
$ afinfo -r sin2.aac

File:           sin2.aac
File type ID:   adts
Num Tracks:     1
----
Data format:     1 ch,  22050 Hz, 'aac ' (0x00000000) 0 bits/channel, 0 bytes/packet, 1024 frames/packet, 0 bytes/frame
Channel layout: Mono
audio bytes: 301210
audio packets: 1081
estimated duration: 50.202 sec
bit rate: 48000 bits per second
packet size upper bound: 768
maximum packet size: 287
audio data file offset: 0
optimized
format list:
[ 0] format:	  2 ch,  44100 Hz, 'aacp' (0x00000000) 0 bits/channel, 0 bytes/packet, 2048 frames/packet, 0 bytes/frame
Channel layout: Stereo (L R)
[ 1] format:	  1 ch,  44100 Hz, 'aach' (0x00000000) 0 bits/channel, 0 bytes/packet, 2048 frames/packet, 0 bytes/frame
Channel layout: Mono
[ 2] format:	  1 ch,  22050 Hz, 'aac ' (0x00000000) 0 bits/channel, 0 bytes/packet, 1024 frames/packet, 0 bytes/frame
Channel layout: Mono

 */
    var audioContext = global["AudioContext"] ? new AudioContext() : new webkitAudioContext();

    var audioObjectType    = 29;
    var aacFrameDuration   = 0.02321995464704;
    var primingDuration    = (2112 / 1024) * aacFrameDuration;

    FileLoader.toArrayBuffer(file, function(arrayBuffer) {

        var aacBitStream = new Uint8Array(arrayBuffer);
        var adts         = ADTS.parse(aacBitStream);
        var blob         = ADTS.toBlob(aacBitStream, adts, { ESTIMATED_DURATION: AAC.ESTIMATED_DURATION });
        var adtsDuration = adts.duration;

        FileLoader.toArrayBuffer(blob, function(arrayBuffer) {
            audioContext.decodeAudioData(arrayBuffer, function(audioBuffer) { // @arg AudioBuffer - PCM data
                var additionalDuration = audioBuffer.duration;

                console.log({ adtsDuration: adtsDuration, additionalDuration: additionalDuration });

                if ((additionalDuration | 0) >= (adtsDuration | 0)) {
                    test.done(pass());
                } else {
                    test.done(miss());
                }

                // var source = audioContext.createBufferSource();
                // source.buffer = audioBuffer;
                // source.connect(audioContext.destination);
                // source.start(0, 0, 1);
            });
        });


    }, function(error) {
        console.error(error.message);
        test.done(miss());
    });
}

function testADTSRawData_detectEncoder(test, pass, miss) {
// Audacity で 0.046439909297052155 の無音の wave ファイル(0.0464.wav)を作成
//
// $ ffmpeg -y -i 0.0464.wav -ar 44100 0.0464.aac でaac に変換
// > Input #0, wav, from '0.0464.wav':
// >   Duration: 00:00:00.05, bitrate: 1424 kb/s
// >     Stream #0:0: Audio: pcm_f32le ([3][0][0][0] / 0x0003), 44100 Hz, 1 channels, flt, 1411 kb/s
// > Output #0, adts, to '0.0464.aac':
// >   Metadata:
// >     encoder         : Lavf57.25.100
// >     Stream #0:0: Audio: aac (LC), 44100 Hz, mono, fltp, 69 kb/s
// >     Metadata:
// >       encoder         : Lavc57.24.102 aac
// > Stream mapping:
// >   Stream #0:0 -> #0:0 (pcm_f32le (native) -> aac (native))
// > Press [q] to stop, [?] for help
// > size=       0kB time=00:00:00.04 bitrate=   8.6kbits/s speed=  17x
// > video:0kB audio:0kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 72.413795
//
// $ afinfo -r 0.0464.aac
// > File:           0.0464.aac
// > File type ID:   adts
// > Num Tracks:     1
// > ----
// > Data format:     1 ch,  44100 Hz, 'aac ' (0x00000000) 0 bits/channel, 0 bytes/packet, 1024 frames/packet, 0 bytes/frame
// > Channel layout: Mono
// > audio bytes: 50
// > audio packets: 3
// > estimated duration: 0.070 sec
// > bit rate: 5742 bits per second
// > packet size upper bound: 768
// > maximum packet size: 21
// > audio data file offset: 0
// > optimized
// > format list:
// > [ 0] format:	  1 ch,  44100 Hz, 'aac ' (0x00000000) 0 bits/channel, 0 bytes/packet, 1024 frames/packet, 0 bytes/frame
// > Channel layout: Mono
// > ----

// AAC の先頭 frame の rawDataBlock に encoder の名前が格納されているのでそれを取得する

    //                                    0 1 2 3 4 5 6 7 8 
    var AAC_44100_MONO_2 = _toUint8Array("FFF15040039FFCDE02004C61766335372E32342E313032000230400EFFF15040017FFC01182007FFF15040017FFC01182007");
                                                           // 4C61766335372E32342E313032 = Lavc57.24.102

    var adts = ADTS.parse(AAC_44100_MONO_2);
    var rawData = ADTSRawData.parse(adts, AAC_44100_MONO_2, { "maxElements": 1 });

    if (rawData.encoder === "Lavc") {
        test.done(pass());
    } else {
        test.done(miss());
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

return test.run();

})(GLOBAL);

