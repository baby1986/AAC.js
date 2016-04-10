// AAC test

require("../../lib/WebModule.js");

WebModule.VERIFY  = true;
WebModule.VERBOSE = true;
WebModule.PUBLISH = true;

require("../../node_modules/uupaa.fileloader.js/lib/FileLoader.js");
require("../../node_modules/uupaa.hash.js/node_modules/uupaa.bit.js/lib/Bit.js");
require("../../node_modules/uupaa.hash.js/node_modules/uupaa.bit.js/lib/BitView.js");
require("../../node_modules/uupaa.hash.js/lib/Hash.js");
require("../wmtools.js");
require("../../lib/ADTS.js");
require("../../lib/AAC.js");
require("../../release/AAC.n.min.js");
require("../testcase.js");

