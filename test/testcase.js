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
        testAAC_PACKING_A,
        testAAC_PACKING_B,
        testAAC_PACKING_C,
        testAAC_AAC_LC_parse,
        testAAC_toBlob,
    ]);
}

// --- test cases ------------------------------------------
function testAAC_PACKING_A(test, pass, miss) {
    var adts = ADTS.parse(ADTS.PACKING_A);
    var f0   = adts.frames[0];

    console.dir(adts);
    console.dir(f0);

    if (adts.errorBytes === 0 && f0.error === false) {
        if (adts.duration) {
            if (adts.frames.length === 2) {
                if (f0.mpegVersion === 4) {
                    if (f0.crcProtection === false) {
                        if (f0.audioObjectType === "AAC-LC") {
                            if (f0.samplingRate === 44100) {
                                if (f0.channels === 2) {
                                    if (f0.adtsFrameLength === 139) {
                                        if (f0.adtsHeaderLength === 7) {
                                            if (f0.crcLength === 0) {
                                                if (f0.rawDataBlockLength === 139 - 7) {
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
    test.done(miss());
}

function testAAC_PACKING_B(test, pass, miss) {
    var adts = ADTS.parse(ADTS.PACKING_B);
    var f0   = adts.frames[0];

    console.dir(adts);
    console.dir(f0);

    if (adts.errorBytes === 0 && f0.error === false) {
        if (adts.duration) {
            if (adts.frames.length === 1) {
                if (f0.mpegVersion === 4) {
                    if (f0.crcProtection === false) {
                        if (f0.audioObjectType === "AAC-LC") {
                            if (f0.samplingRate === 22050) { // 44100 / 2 = 22050
                                if (f0.channels === 2) { // L/R
                                    if (f0.adtsFrameLength === 278) {
                                        if (f0.adtsHeaderLength === 7) {
                                            if (f0.crcLength === 0) {
                                                if (f0.rawDataBlockLength === 278 - 7) {
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
    test.done(miss());
}


function testAAC_PACKING_C(test, pass, miss) {
    var adts = ADTS.parse(ADTS.PACKING_C);
    var f0   = adts.frames[0];

    console.dir(adts);
    console.dir(f0);

    if (adts.errorBytes === 0 && f0.error === false) {
        if (adts.duration) {
            if (adts.frames.length === 1) {
                if (f0.mpegVersion === 4) {
                    if (f0.crcProtection === false) {
                        if (f0.audioObjectType === "AAC-LC") {
                            if (f0.samplingRate === 22050) { // 44100 / 2 = 22050
                                if (f0.channels === 1) { // mono
                                    if (f0.adtsFrameLength === 278) {
                                        if (f0.adtsHeaderLength === 7) {
                                            if (f0.crcLength === 0) {
                                                if (f0.rawDataBlockLength === 278 - 7) {
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
    test.done(miss());
}


function testAAC_AAC_LC_parse(test, pass, miss) {
    var file = "../assets/v0.aac";

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
                                    if (f0.audioObjectType === "AAC-LC") {
                                        if (f0.samplingRate === 44100) {
                                            if (f0.channels === 2) {
                                                if (f0.adtsFrameLength === 139) {
                                                    if (f0.adtsHeaderLength === 7) {
                                                        if (f0.crcLength === 0) {
                                                            if (f0.rawDataBlockLength === 139 - 7) {
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
    var file = "../assets/v2.aac";

    FileLoader.toArrayBuffer(file, function(arrayBuffer) {

        var byteStream = new Uint8Array(arrayBuffer);
        var adts       = ADTS.parse(byteStream);
        var audioBlob1 = ADTS.toBlob(byteStream, 0, adts);
        var audioBlob2 = ADTS.toBlob(byteStream, 128, adts); // add 128 packet
        var realDuration = adts.duration;

        FileLoader.toArrayBuffer(audioBlob1, function(arrayBuffer1) {
            FileLoader.toArrayBuffer(audioBlob2, function(arrayBuffer2) {
                audioContext.decodeAudioData(arrayBuffer1, function(audioBuffer1) { // @arg AudioBuffer - PCM data
                    audioContext.decodeAudioData(arrayBuffer2, function(audioBuffer2) { // @arg AudioBuffer - PCM data
                        var source = audioContext.createBufferSource();

                        var fakeDuration1 = audioBuffer1.duration;
                        var fakeDuration2 = audioBuffer2.duration;

                        console.log({ realDuration: realDuration, fakeDuration1: fakeDuration1, fakeDuration2: fakeDuration2 });

                        if (fakeDuration2 >= realDuration) {
                            test.done(pass());
                        } else {
                            test.done(miss());
                        }
                        // source.buffer = audioBuffer;
                        // source.connect(audioContext.destination);
                        // source.start(0, 0, 1);
                    });
                });
            });
        });


    }, function(error) {
        console.error(error.message);
        test.done(miss());
    });
}

return test.run();

})(GLOBAL);

