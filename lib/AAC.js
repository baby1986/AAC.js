(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("AAC", function moduleClosure(/* global, WebModule, VERIFY, VERBOSE */) {
"use strict";

// --- technical terms / data structure --------------------
/*
- TechnicalTerms
    - https://github.com/uupaa/AAC.js/wiki/TechnicalTerms
- AudioMetaDataObject
    - https://github.com/uupaa/AA:w
    C.js/wiki/AudioMetaDataObject
- ADTSHeaderObject
    - https://github.com/uupaa/AAC.js/wiki/ADTSHeaderObject
*/

// --- dependency modules ----------------------------------
// --- import / local extract functions --------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
var AAC = {
    "repository": "https://github.com/uupaa/AAC.js",
};

// --- implements ------------------------------------------

return AAC; // return entity

});

