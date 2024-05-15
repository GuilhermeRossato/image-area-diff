## image-area-diff - Verify differences between PNG images by pixel color distance

A simple and straightforward JavaScript module to compare images conditionally by areas. Works with PNG files only.

Used to detect differences between images in specific areas (whitelisting) or ignoring certain areas (blacklisting) by returning the sum of the color distance of all relevant pixels in the image, with this module you can configure which areas should be considered or ignored: whitelisting spaces that are supposed to be relevant and only counting differences in those parts of the image.

Especially useful to filter 'dinamic' parts of screenshots and compare the rest.

### API / usage

```js
const imageDiff = require('image-area-diff');

imageDiff({
    "threshold": 0.1, // Sensitivity between 0 and 1 (default 0.1)
    "compare": ["old.png", "new.png"], // The source and target images
    "output": "out.png",  // Optionally save the difference to file
    "whitelist": [   // Specify areas that are relevant (default everything)
        {left: 0, top: 0, width: 600, height: 100},   // whitelist by left,top,width,height
        {left: 100, top: 100, right:400, bottom: 100},   // whitelist by left,top,right,bottom
        {x: 120, y: 125},   // whitelist a pixel (x,y variant)
        {x: 10, y: 130, radius: 10},   // whitelist a circular area (x,y,radius variant)
    ],
    "blacklist": [ // Specify areas that are ignored (default nothing)
        {x: 0, y: 0} // Ignore a single pixel regardless of whitelist
    ],
    "includeAA": true, // Count antialiasing differences (default true)
}).then(
    pixels => console.log("Difference:", pixels)
);
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
