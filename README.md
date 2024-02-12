## image-area-diff

A simple and straightforward JavaScript module to compare images conditionally by areas. Works with PNG files only.

Used to detect differences between image but not everywhere in the image, with this module you can configure which areas should trigger differences or not. Features whitelisting spaces that are supposed to be different and only mark differences in the other parts of the image.

Especially useful to filter 'dinamic' parts of screenshots and compare the rest.

### API / usage

```js
var imageDiff = require('image-area-diff');

imageDiff({
    "threshold": 0.1,
    "compare": ["old.png", "new.png"],
    "output": "out.png",   // Optional, save difference to file
    "whitelist": [   // Specify areas that can change freely and don't count pixel diferences
        {left: 0, top: 0, width: 600, height: 100},   // whitelist the header of the image (left,top,width,height variant)
        {left: 100, top: 100, right:400, bottom: 100},   // whitelist the center of the footer (left,top,right,bottom variant)
        {x: 120, y: 125},   // whitelist a pixel (x,y variant)
        {x: 10, y: 130, radius: 10},   // whitelist a circular area (x,y,radius variant)
    ],
    "includeAA": true, // Default to count antialiasing differences
}).then(pixels => console.log("Difference in pixels: ",pixels));
```

### Install

Install with NPM:

```bash
npm install image-area-diff
```

To build a binary executable version (after creating and testing your usage), use the API to configure the usage as you like, then:
```bash
npm install -g pkg
pkg index.js --target host --output app.exe
```

### [Changelog](https://github.com/GuilhermeRossato/image-area-diff/releases)

### Special thanks

Special thanks to [mapbox's pixelmatch](https://github.com/mapbox/pixelmatch) module for which my module is heavily inspired on.
