var ModuleTestADTS = (function(global) {

var test = new Test(["ADTS"], { // Add the ModuleName to be tested here (if necessary).
        disable:    false, // disable all tests.
        browser:    false,  // enable browser test.
        worker:     false,  // enable worker test.
        node:       false,  // enable node test.
        nw:         true,  // enable nw.js test.
        el:         true,  // enable electron (render process) test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
            console.error(error.message);
        }
    });

if (IN_NW || IN_EL) {
    test.add([
        testADTS_structure_verification,
    ]);
}

// --- test cases ------------------------------------------
function testADTS_structure_verification(test, pass, miss) {
    // MPEG-2 TS から ffmpeg を使って分離した ADTS 付きの AAC をパースし構造を確認するテスト

    var fs = require("fs");
    var sourceFile = "../assets/sample1/aac/7.aac";
    var verifyFile1 = "../assets/sample1/test_result/7.header.json";
    var verifyFile2 = "../assets/sample1/test_result/7.stream.bin";

    FileLoader.toArrayBuffer(sourceFile, function(buffer) {
        console.log("LOAD FROM: ", sourceFile, buffer.byteLength);

debugger;
        var ADTSFrameArray = ADTS.parse(new Uint8Array(buffer));

        console.log("LOAD FROM: ", sourceFile, buffer.byteLength);

        fs.writeFileSync(verifyFile1, JSON.stringify(ADTSFrameArray[0].header, null, 2)); // Finder で確認
        fs.writeFileSync(verifyFile2, new Buffer(ADTSFrameArray[0].stream), "binary"); // Finder で確認

        console.log("WRITE TO: ", verifyFile1, verifyFile2);

    }, function(error) {
        console.error(error.message);
    });
}

return test.run();

})(GLOBAL);

