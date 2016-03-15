var ModuleTestADTS = (function(global) {

var test = new Test(["ADTS"], { // Add the ModuleName to be tested here (if necessary).
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
        testADTS_structure_verification,
    ]);
}

// --- test cases ------------------------------------------
function testADTS_structure_verification(test, pass, miss) {
    // MPEG-2 TS から ffmpeg を使って分離した ADTS 付きの AAC をパースし構造を確認するテスト

/*
    var sourceFile = "../assets/sample1/aac/7.aac";
    var verifyFile1 = "../assets/sample1/test_result/7.header.json";
    var verifyFile2 = "../assets/sample1/test_result/7.stream.bin";
 */
    var sourceFile = "../assets/a000.aac";

if (1) { // Blob を経由してもちゃんと鳴る
    WebAudio.init(function(audioContext) { // @arg PlayableAudioContext
        FileLoader.toArrayBuffer(sourceFile, function(arrayBuffer) {

            // get AAC duration
            var byteStream = new Uint8Array(arrayBuffer);
            var metaData   = ADTS.parse(byteStream);

            console.log("AAC duration", metaData.duration);

            var audioBlob = new Blob([arrayBuffer], { type: "audio/aac" });
            FileLoader.toArrayBuffer(audioBlob, function(arrayBuffer) {

                audioContext.decodeAudioData(arrayBuffer, function(audioBuffer) { // @arg AudioBuffer - PCM data
                    console.dir({
                        duration:   audioBuffer.duration,
                        length:     audioBuffer.length,
                        sampleRate: audioBuffer.sampleRate,
                        numberOfChannels: audioBuffer.numberOfChannels
                    });
                    var sourceNode = audioContext.createBufferSource();


                    sourceNode.buffer = audioBuffer; // set PCM data
                    sourceNode.connect(audioContext.destination); // PCM -> SPEAKER
                    sourceNode.start(0); // playback scheduling

                    test.done(pass());
                }, function(error) {
                    console.error("decodeAudioData error", error);
                    test.done(miss());
                });

            });

        }, function(error) {
            console.error(error.message);
            test.done(miss());
        });
    });
}
if (0) { // 鳴る
    WebAudio.init(function(audioContext) { // @arg PlayableAudioContext
        FileLoader.toArrayBuffer(sourceFile, function(arrayBuffer) {
            audioContext.decodeAudioData(arrayBuffer, function(audioBuffer) { // @arg AudioBuffer - PCM data
                console.dir({
                    duration:   audioBuffer.duration,
                    length:     audioBuffer.length,
                    sampleRate: audioBuffer.sampleRate,
                    numberOfChannels: audioBuffer.numberOfChannels
                });
                var sourceNode = audioContext.createBufferSource();

                sourceNode.buffer = audioBuffer; // set PCM data
                sourceNode.connect(audioContext.destination); // PCM -> SPEAKER
                sourceNode.start(0); // playback scheduling

                test.done(pass());
            }, function(error) {
                console.error("decodeAudioData error", error);
                test.done(miss());
            });

        }, function(error) {
            console.error(error.message);
            test.done(miss());
        });
    });
}
if (0) { // ADTS ヘッダをカットすると当然鳴らない, エラーになる
    WebAudio.init(function(audioContext) { // @arg PlayableAudioContext
        FileLoader.toArrayBuffer(sourceFile, function(arrayBuffer) {
            // ADTS.parse から ADTS.toBlob にエラーの原因がある
            // 起きたらここから続き!!
            var byteStream = new Uint8Array(arrayBuffer);
            var metaData   = ADTS.parse(byteStream);
            var audioBlob  = ADTS.toBlob(byteStream, metaData);

            console.log("AAC duration", metaData.duration);

            FileLoader.toArrayBuffer(audioBlob, function(arrayBuffer, statusCode) {

                audioContext.decodeAudioData(arrayBuffer, function(audioBuffer) { // @arg AudioBuffer - PCM data

                    console.dir({
                        duration:   audioBuffer.duration,
                        length:     audioBuffer.length,
                        sampleRate: audioBuffer.sampleRate,
                        numberOfChannels: audioBuffer.numberOfChannels
                    });

                    var sourceNode = audioContext.createBufferSource();

                    sourceNode.buffer = audioBuffer; // set PCM data
                    sourceNode.connect(audioContext.destination); // PCM -> SPEAKER
                    sourceNode.start(0); // playback scheduling

                    test.done(pass());
                }, function(error) {
                    console.error("decodeAudioData error", error);
                    test.done(miss());
                });
            }, function(error) {
                console.error(error);
                test.done(miss());
            });

        }, function(error) {
            console.error(error.message);
            test.done(miss());
        });
    });
}

/*
        var fs = require("fs");
        fs.writeFileSync(verifyFile1, JSON.stringify(ADTSFrameArray[0].header, null, 2)); // Finder で確認
        fs.writeFileSync(verifyFile2, new Buffer(ADTSFrameArray[0].stream), "binary"); // Finder で確認

        console.log("WRITE TO: ", verifyFile1, verifyFile2);
 */
}

return test.run();

})(GLOBAL);

