// ADTS test

require("../../lib/WebModule.js");

WebModule.verify  = true;
WebModule.verbose = true;
WebModule.publish = true;

require("../../node_modules/uupaa.fileloader.js/lib/FileLoader.js");
require("../../node_modules/uupaa.bit.js/lib/Bit.js");
require("../../node_modules/uupaa.bit.js/lib/BitView.js");
require("../wmtools.js");
require("../../lib/ADTS.js");
require("../../release/ADTS.n.min.js");
require("../testcase.js");

