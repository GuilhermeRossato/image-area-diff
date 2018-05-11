## image-area-diff

A simple and straightforward JavaScript library to compare images conditionally by areas.

Used to detect differences between image areas, not everywhere in the image. Features whitelisting spaces that are supposed to be different and only mark differences in the other parts of the image.

Especially useful to filter 'dinamic' parts of screenshots and compare the rest. Also features blacklisting of areas to work conditionally the other way.

### API

```js
var imageDiff = require('image-area-dif');

var numDiffPixels = imageDiff(
    "threshold": 0.1,
    "compare": ["old.png", "new.png"],
    "whitelist": [
        {left: 0, top: 0, width: 600, height: 100}, // whitelist the header of the image (left,top,width,height variant)
        {left: 100, top: 100, right:400, bottom: 100}, // whitelist the center of the footer (left,top,right,bottom variant)
        {x: 120, y: 125}, // whitelist a pixel (x,y variant)
        {x: 10, y: 130, radius: 10}, // whitelist a circular area (x,y,radius variant)
    ],
    "output": "diff.png" // Optional, save difference to file
);
```

### Install

Install with NPM:

```bash
npm install image-area-diff
```

To build a browser-compatible version, clone the repository locally, then run:

```bash
npm install -g browserify
browserify -s image-area-diff index.js > image-area-diff.js
```

To build a binary executable version, use the API to configure the usage as you like, then:
```bash
npm install -g pkg
pkg index.js --target host --output app.exe
```

### [Changelog](https://github.com/GuilhermeRossato/image-area-diff/releases)