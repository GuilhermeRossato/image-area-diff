var fs = require('fs');
var PNG = require('pngjs').PNG;

module.exports = imageDiff;

async function imageDiff(config) {
	config = (config || {});

	Object.assign(config, {
		threshold: 0.1,
		timeout: 10000,
		includeAA: true,
	});

	if (!config.compare) {
		throw new Error(
			'Missing required \'compare\' from parameter\'s config'
		);
	}
	if (typeof (config.compare) !== 'object' || !(config.compare instanceof Array) || config.compare.length !== 2) {
		throw new Error(
			'Parameter \'compare\' should be an array of 2 elements'
		);
	}
	if (config.whitelist instanceof Array) {
		config.whitelist = config.whitelist.filter(a => a);
	}

	try {
		await Promise.all([
			new Promise((resolve, reject) => {
				fs.access(config.compare[0], fs.constants.R_OK, err =>
					err ? reject(`Unable to read file ${config.compare[0]}`) : resolve()
				);
			}),
			new Promise((resolve, reject) => {
				fs.access(config.compare[1], fs.constants.R_OK, err =>
					err ? reject(`Unable to read file ${config.compare[1]}`) : resolve()
				);
			}),
		]);
	} catch (err) {
		throw new Error(err);
	}

	var images = await new Promise(function(resolve, reject) {
		var img1 = fs.createReadStream(config.compare[0])
			.pipe(new PNG()).on('parsed', step).on('error', reject);
		var img2 = fs.createReadStream(config.compare[1])
			.pipe(new PNG()).on('parsed', step).on('error', reject);
		var output;
		if (config.output) {
			// output = fs.createReadStream('test/fixtures/1b.png')
			output = fs.createReadStream(config.compare[0])
				.pipe(new PNG()).on('parsed', step).on('error', reject);
		}

		var fileCount = 0;
		var timeout = setTimeout(reject.bind(this, 'Timeout'), config.timeout);
		function step() {
			fileCount++;
			if (fileCount === 2 && !config.output) {
				clearTimeout(timeout);
				resolve([img1, img2]);
			} else if (fileCount === 3 && config.output) {
				clearTimeout(timeout);
				resolve([img1, img2, output]);
			}
		}
	});

	const img1 = images[0].data;
	const img2 = images[1].data;
	const output = images[2];
	const maxDelta = 35215 * config.threshold * config.threshold;
	const width = images[0].width;
	const height = images[0].height;

	var pixels = 0;
	var x, y, pos, delta;
	for (y = 0; y < height; y++) {
		for (x = 0; x < width; x++) {

			pos = (y * width + x) * 4;
			if (x < 10) { continue; }
			// squared YUV distance between colors at this pixel position
			delta = colorDelta(img1, img2, pos, pos);
			// the color difference is above the threshold
			if (delta > maxDelta) {
				// check it's a real rendering difference or just anti-aliasing
				if (!config.includeAA &&
					(
						antialiased(img1, x, y, width, height, img2) ||
						antialiased(img2, x, y, width, height, img1)
					)
				) {
					// one of the pixels is anti-aliasing; draw as yellow and do not count as difference
					if (config.output) drawPixel(output.data, pos, 255, 255, 0);

				} else {
					// found substantial difference not caused by anti-aliasing; check if we're in a valid pixel
					if (shouldCountAsDiffH(config, x, y) && shouldCountAsDiffV(config, x, y)) {
						// found a pixel that should be counted
						if (config.output) drawPixel(output.data, pos, 255, 0, 0);
						pixels++;
					} else {
						// the pixel is whitelisted or not blacklisted; draw as green and do not count as difference

						output[pos + 0] += (output[pos + 0] < 20 ? -20 : 0);
						output[pos + 1] += (output[pos + 1] < 240 ? 14 : 0);
						output[pos + 2] += (output[pos + 2] > 20 ? -20 : 0);
						output[pos + 3] += (output[pos + 3] < 240 ? 10 : 0);
						if (config.output) drawPixel(output.data, pos, 0, 128, 0);
					}
				}
			}
		}
	}
	if (config.output) {
		const file = fs.createWriteStream(config.output);
		/*
		output.data[0] = 255;
		output.data[1] = 255;
		output.data[2] = 255;
		output.data[4] = 255;
		output.data[5] = 255;
		output.data[6] = 255;
		*/
		await new Promise((resolve, reject) => {
			file.on('finish', resolve);
			file.on('error', reject);
			output.pack().pipe(file);
		});
		file.end();
	}
	return pixels;
}

function shouldCountAsDiffH(options, x, y) {
	var i, whitelist;
	if (options.whitelist) {
		for (i = options.whitelist.length - 1; i >= 0; i--) {
			whitelist = options.whitelist[i];
			if (whitelist.left !== undefined && whitelist.right !== undefined) {
				if (x >= whitelist.left && x <= whitelist.right) {
					return false;
				}
			} else if (whitelist.left !== undefined && whitelist.width !== undefined) {
				if (x >= whitelist.left && x <= whitelist.left + whitelist.width) {
					return false;
				}
			} else if (whitelist.x !== undefined && whitelist.width !== undefined) {
				if (x >= whitelist.x && x <= whitelist.x + whitelist.width) {
					return false;
				}
			} else if (whitelist.x !== undefined && whitelist.y !== undefined && whitelist.radius !== undefined) {
				var distSqr = (whitelist.x - x) * (whitelist.x - x) + (whitelist.y - y) * (whitelist.y - y);
				if (distSqr < whitelist.radius * whitelist.radius) {
					return false;
				}
			} else if (whitelist.x !== undefined && whitelist.y !== undefined) {
				if (whitelist.x === x && whitelist.y === y) {
					return false;
				}
			} else {
				throw new Error('Unknown whitelist rule ' + i);
			}
		}
	}
	return true;
}

function shouldCountAsDiffV(options, x, y) {
	var i, whitelist;
	if (options.whitelist) {
		for (i = options.whitelist.length - 1; i >= 0; i--) {
			whitelist = options.whitelist[i];
			if (whitelist.top !== undefined && whitelist.bottom !== undefined) {
				if (y >= whitelist.top && y <= whitelist.bottom) {
					return false;
				}
			} else if (whitelist.top !== undefined && whitelist.width !== undefined) {
				if (y >= whitelist.top && y <= whitelist.top + whitelist.width) {
					return false;
				}
			} else if (whitelist.y !== undefined && whitelist.width !== undefined) {
				if (y >= whitelist.y && y <= whitelist.y + whitelist.width) {
					return false;
				}
			} else if (whitelist.x !== undefined && whitelist.y !== undefined && whitelist.radius !== undefined) {
			} else if (whitelist.x !== undefined && whitelist.y !== undefined) {
			} else {
				throw new Error('Unknown whitelist rule ' + i);
			}
		}
	}
	return true;
}

// check if a pixel is likely a part of anti-aliasing;
// based on "Anti-aliased Pixel and Intensity Slope Detector" paper by V. Vysniauskas, 2009
// the following function was taken from mapbox's pixelmath module

function antialiased(img, x1, y1, width, height, img2) {
	var x0 = Math.max(x1 - 1, 0);
	var y0 = Math.max(y1 - 1, 0);
	var x2 = Math.min(x1 + 1, width - 1);
	var y2 = Math.min(y1 + 1, height - 1);
	var pos = (y1 * width + x1) * 4;
	var zeroes = 0;
	var positives = 0;
	var negatives = 0;
	var min = 0;
	var max = 0;
	var minX, minY, maxX, maxY;

	// go through 8 adjacent pixels
	for (var x = x0; x <= x2; x++) {
		for (var y = y0; y <= y2; y++) {
			if (x === x1 && y === y1) continue;

			// brightness delta between the center pixel and adjacent one
			var delta = colorDelta(img, img, pos, (y * width + x) * 4, true);

			// count the number of equal, darker and brighter adjacent pixels
			if (delta === 0) zeroes++;
			else if (delta < 0) negatives++;
			else if (delta > 0) positives++;

			// if found more than 2 equal siblings, it's definitely not anti-aliasing
			if (zeroes > 2) return false;

			if (!img2) continue;

			// remember the darkest pixel
			if (delta < min) {
				min = delta;
				minX = x;
				minY = y;
			}
			// remember the brightest pixel
			if (delta > max) {
				max = delta;
				maxX = x;
				maxY = y;
			}
		}
	}

	if (!img2) return true;

	// if there are no both darker and brighter pixels among siblings, it's not anti-aliasing
	if (negatives === 0 || positives === 0) return false;

	// if either the darkest or the brightest pixel has more than 2 equal siblings in both images
	// (definitely not anti-aliased), this pixel is anti-aliased
	return (!antialiased(img, minX, minY, width, height) && !antialiased(img2, minX, minY, width, height)) ||
	(!antialiased(img, maxX, maxY, width, height) && !antialiased(img2, maxX, maxY, width, height));
}

// calculate color difference according to the paper "Measuring perceived color difference
// using YIQ NTSC transmission color space in mobile applications" by Y. Kotsarenko and F. Ramos
// the following functions were taken from mapbox's pixelmath module

function colorDelta(img1, img2, k, m, yOnly) {
	var a1 = img1[k + 3] / 255;
	var a2 = img2[m + 3] / 255;

	var r1 = blend(img1[k + 0], a1);
	var g1 = blend(img1[k + 1], a1);
	var b1 = blend(img1[k + 2], a1);

	var r2 = blend(img2[m + 0], a2);
	var g2 = blend(img2[m + 1], a2);
	var b2 = blend(img2[m + 2], a2);

	var y = rgb2y(r1, g1, b1) - rgb2y(r2, g2, b2);

	if (yOnly) return y; // brightness difference only

	var i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2);
	var q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2);

	return 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
}

function rgb2y(r, g, b) { return r * 0.29889531 + g * 0.58662247 + b * 0.11448223; }
function rgb2i(r, g, b) { return r * 0.59597799 - g * 0.27417610 - b * 0.32180189; }
function rgb2q(r, g, b) { return r * 0.21147017 - g * 0.52261711 + b * 0.31114694; }

// blend semi-transparent color with white
function blend(c, a) {
	return 255 + (c - 255) * a;
}

function drawPixel(output, pos, r, g, b) {
	output[pos + 0] = r;
	output[pos + 1] = g;
	output[pos + 2] = b;
	output[pos + 3] = 255;
}
