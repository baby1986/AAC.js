# AAC.js [![Build Status](https://travis-ci.org/uupaa/AAC.js.svg)](https://travis-ci.org/uupaa/AAC.js)

[![npm](https://nodei.co/npm/uupaa.aac.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.aac.js/)

AAC-LC/HE-AAC parser.

This module made of [WebModule](https://github.com/uupaa/WebModule).

## Documentation
- [Spec](https://github.com/uupaa/AAC.js/wiki/)
- [API Spec](https://github.com/uupaa/AAC.js/wiki/AAC)

## Browser, NW.js and Electron

```js
<script src="<module-dir>/lib/WebModule.js"></script>
<script src="<module-dir>/lib/AAC.js"></script>
<script>
var stream = new Uint8Array(...);
var adts = AAC.parse(stream);

console.log( adts.duration );  // -> 5.410249433106576
</script>
```

## WebWorkers

```js
importScripts("<module-dir>/lib/WebModule.js");
importScripts("<module-dir>/lib/AAC.js");

```

## Node.js

```js
require("<module-dir>/lib/WebModule.js");
require("<module-dir>/lib/AAC.js");

```

