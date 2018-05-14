'use strict';

var assert = require('assert');
var imageDiff = require('../image-area-diff.js');

describe('config parameters', function() {
	it('should throw errors for missing \'compare\'', function() {
		assert.throws(imageDiff, new Error(
			'Missing \'compare\' from parameter\'s config'
		));
	});
	it('should throw errors for missing compare\'s output', function() {
		assert.throws(
			imageDiff.bind(this, {compare: '1.png'}),
			new Error(
				'Missing \'compare\' from parameter\'s config'
			)
		);
	});
});

/*
test('throws an error when output is not specified', {bail: true}, function() {
	tap.throws(imageDiff());
});
*/
