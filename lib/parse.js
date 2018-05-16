'use strict';

const parse = require('protobufjs').parse;

module.exports = (source, root, options) => {
  source = source.split('\n')
    .map(line => line.trim())
    // ingore import
    .filter(line => !line.startsWith('import'))
    .join('\n');
  return parse(source, root, options);
};
