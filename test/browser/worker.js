// AAC test

onmessage = function(event) {
    self.unitTest = event.data; // { message, setting: { secondary, baseDir } }

    if (!self.console) { // polyfill WebWorkerConsole
        self.console = function() {};
        self.console.dir = function() {};
        self.console.log = function() {};
        self.console.warn = function() {};
        self.console.error = function() {};
        self.console.table = function() {};
    }

    importScripts("../../lib/WebModule.js");

    WebModule.VERIFY  = true;
    WebModule.VERBOSE = true;
    WebModule.PUBLISH = true;

    importScripts("../../node_modules/uupaa.task.js/lib/Task.js");
    importScripts("../../node_modules/uupaa.task.js/lib/TaskMap.js");
    importScripts("../../node_modules/uupaa.fileloader.js/node_modules/uupaa.uri.js/lib/URISearchParams.js");
    importScripts("../../node_modules/uupaa.fileloader.js/node_modules/uupaa.uri.js/lib/URI.js");
    importScripts("../../node_modules/uupaa.fileloader.js/lib/FileLoader.js");
    importScripts("../../node_modules/uupaa.fileloader.js/lib/FileLoaderQueue.js");
    importScripts("../../node_modules/uupaa.hash.js/node_modules/uupaa.bit.js/lib/Bit.js");
    importScripts("../../node_modules/uupaa.hash.js/node_modules/uupaa.bit.js/lib/BitView.js");
    importScripts("../../node_modules/uupaa.hash.js/lib/Hash.js");
    importScripts("../wmtools.js");
    importScripts("../../lib/AAC.js");
    importScripts("../../lib/ADTS.js");
    importScripts("../../release/AAC.w.min.js");
    importScripts("../testcase.js");

    self.postMessage(self.unitTest);
};

