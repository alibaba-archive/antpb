# antpb
Protocol Buffers for JavaScript. It from the dcodeIO protobufjs, we modify some files to achieve our need.

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/antpb.svg?style=flat-square
[npm-url]: https://npmjs.org/package/antpb
[travis-image]: https://img.shields.io/travis/node-modules/antpb.svg?style=flat-square
[travis-url]: https://travis-ci.org/node-modules/antpb
[codecov-image]: https://codecov.io/gh/node-modules/antpb/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/antpb
[david-image]: https://img.shields.io/david/node-modules/antpb.svg?style=flat-square
[david-url]: https://david-dm.org/node-modules/antpb
[snyk-image]: https://snyk.io/test/npm/antpb/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/antpb
[download-image]: https://img.shields.io/npm/dm/antpb.svg?style=flat-square
[download-url]: https://npmjs.org/package/antpb

## Install

```bash
$ tnpm install antpb --save
```

## Usage

- load all *.proto files in specified directory

```js
const protobuf = require('antpb');

const root = protobuf.loadAll('/proto_file_path');

const ProtoObj = root.lookup('com.alipay.test.service.ProtoObj');
const map = new Map();
map.set(false, {
  name: 'Peter',
  finalField: '123',
});

const req = ProtoObj.create({
  testObj2: {
    name: 'zongyu',
    finalField: '321',
  },
  map3: map,
});

const buf = ProtoObj.encode(req).finish();
const ret = ProtoObj.decode(buf); // => { testObj2: { name: 'zongyu', finalField: '321' }, map3: <Map> }
```

- load interface schame from JSON file

```js
const protobuf = require('@alipay/protobufjs');

const root = protobuf.fromJSON(/proto_json_file_path);

...
```

## API

### Top API

- `loadAll(protoPath, [options])` load all *.proto files in specified directory
  - {String} protoPath - the proto folder
  - {Object} [options] - optional arguments
- `fromJSON(jsonFile, [root])` load interface schame from JSON file
  - {String} jsonFile - JSON file path
  - {Root} [root] - root node, if it is not provided, will create the new one

### Other API

refer: [https://github.com/dcodeIO/protobuf.js](https://github.com/dcodeIO/protobuf.js)
