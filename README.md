# ADTS.js [![Build Status](https://travis-ci.org/uupaa/ADTS.js.svg)](https://travis-ci.org/uupaa/ADTS.js)

[![npm](https://nodei.co/npm/uupaa.adts.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.adts.js/)

ADTS parser.

This module made of [WebModule](https://github.com/uupaa/WebModule).

## Documentation
- [Spec](https://github.com/uupaa/ADTS.js/wiki/)
- [API Spec](https://github.com/uupaa/ADTS.js/wiki/ADTS)

## Browser, NW.js and Electron

```js
<script src="<module-dir>/lib/WebModule.js"></script>
<script src="<module-dir>/lib/ADTS.js"></script>
<script>
var stream = new Uint8Array(...);
var audioMetaData = ADTS.parse(stream);

console.log( audioMetaData.duration );  // -> 5.410249433106576
</script>
```

## WebWorkers

```js
importScripts("<module-dir>/lib/WebModule.js");
importScripts("<module-dir>/lib/ADTS.js");

```

## Node.js

```js
require("<module-dir>/lib/WebModule.js");
require("<module-dir>/lib/ADTS.js");

```

