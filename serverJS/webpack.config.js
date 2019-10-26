//@ts-check

'use strict';

const withDefaults = require('../shared.webpack.config');
const path = require('path');

module.exports = withDefaults({
	context: path.join(__dirname),
	entry: {
		extension: './src/LSPServer.js',
	},
	output: {
		filename: 'LSPServer.js',
		path: path.join(__dirname, 'out')
	}
});