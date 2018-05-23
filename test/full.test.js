// var assert = require('assert');
var imageDiff = require('../image-area-diff.js');

async function assertThrowsAsync(prom, errMessage) {
	var resolved = false;
	try {
		await prom;
		resolved = true;
	} catch (err) {
		if (err.message !== errMessage) {
			throw new Error('Unexpected error with message "' + err.message + '"');
		}
	}
	if (resolved) {
		throw new Error('Unexpected resolve without expected error message "' + errMessage + '"');
	}
}

describe('wrong config parameters', function() {
	it('should throw error for missing \'compare\'', async function() {
		await assertThrowsAsync(imageDiff({}),
			'Missing required \'compare\' from parameter\'s config'
		);
	});
	it('should throw error for invalid \'compare\' parameter', async function() {
		await assertThrowsAsync(imageDiff({compare: '1.png'}),
			'Parameter \'compare\' should be an array of 2 elements'
		);
	});
	it('should throw error for missing compare\'s output', async function() {
		await assertThrowsAsync(imageDiff({compare: ['1.png']}),
			'Parameter \'compare\' should be an array of 2 elements'
		);
	});
	it('should throw error for file not found', async function() {
		await assertThrowsAsync(imageDiff(
			{
				compare: [
					'no-file.png',
					'no-file.png',
				],
			}),
		'Unable to read file no-file.png'
		);
	});
	it('should throw error for invalid whitelist rule compare\'s output', async function() {
		this.timeout(6000);
		await assertThrowsAsync(imageDiff(
			{
				compare: [
					'test/fixtures/1a.png',
					'test/fixtures/1b.png',
				],
				whitelist: [{
					x: 1,
					height: 10,
				}],
			}),
		'heyhey'
		);
	});
});

describe('testing success', function() {
	it('should be able to get difference between 1a.png and 1b.png', async function() {
		this.timeout(6000);
		var pixels = await imageDiff({
			threshold: 0.1,
			compare: [
				'test/fixtures/1a.png',
				'test/fixtures/1b.png',
			],
			output: 'test/fixtures/1c.png', // Optional, save difference to file
			whitelist: [ // Specify areas that can change freely and don't count pixel diferences
				{x: 10, y: 125, radius: 10}, // whitelist a circular area (x,y,radius variant)
			],
		});
		if (pixels !== 25782) {
			throw new Error('Unexpected pixel differences!');
		}
	});
});
