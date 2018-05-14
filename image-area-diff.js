'use strict';

module.exports = function imageDiff(config) {
	config = (config || {});

	if (config) {
		Object.assign(config, {
			threshold: 0.1,
		});
	} else {
		throw new Error('Missing configuration object');
	}
	if (!config.compare || config.compare.length) {
		throw new Error(
			'Missing \'compare\' from parameter\'s config'
		);
	}
	if (!config.compare.length < 2) {
		throw new Error(
			'Missing compare\'s output from parameter\'s config'
		);
	}
	console.log(config.compare, config.threshold);
	return true;
};
