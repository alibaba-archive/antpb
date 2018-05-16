'use strict';

const mm = require('mm');
const path = require('path');
const protobuf = require('..');
const assert = require('assert');
const protoPath = path.join(__dirname, 'fixtures/proto');

describe('test/index.test.js', () => {
  afterEach(mm.restore);

  it('should handle empty folder', () => {
    assert(protobuf.loadAll(path.join(__dirname, '../lib')) == null);
    assert(protobuf.loadAll(path.join(__dirname, 'xxx')) == null);
  });

  it('should encode / decode ok', () => {
    const root = protobuf.loadAll(protoPath);
    const ProtoObj = root.lookup('com.protobuf.test.service.ProtoObj');
    const req = ProtoObj.fromObject({
      testObj2: {
        name: 'zongyu',
        finalField: '321',
      },
      map1: new Map([
        [ 1000, 'C' ],
      ]),
      map3: new Map([
        [ false, {
          name: 'Peter',
          finalField: '123',
        }],
      ]),
    });

    const buf = ProtoObj.encode(req).finish();
    assert(buf.toString('hex') === '1a0d0a067a6f6e67797512033332316a0508e80710027a100800120c0a0550657465721203313233');

    const ret = ProtoObj.decode(buf);
    assert([ 'list1', 'list2', 'list3', 'list4', 'list5', 'map1', 'map2', 'map3', 'map4', 'map5', 'enum2', 'testObj2' ].every(p => {
      return Object.prototype.hasOwnProperty.call(ret, p);
    }));
    assert(Array.isArray(ret.list1) && ret.list1.length === 0);
    assert(Array.isArray(ret.list2) && ret.list2.length === 0);
    assert(Array.isArray(ret.list3) && ret.list3.length === 0);
    assert(Array.isArray(ret.list4) && ret.list4.length === 0);
    assert(Array.isArray(ret.list5) && ret.list5.length === 0);
    assert(ret.map1.size === 1);
    assert(ret.map2.size === 0);
    assert(ret.map3.size === 1);
    assert(ret.map4.size === 0);
    assert(ret.map5.size === 0);
    assert(ret.map3.has(false));
    assert.deepEqual(ret.map3.get(false), { name: 'Peter', finalField: '123' });
    assert(Array.isArray(ret.enum2) && ret.enum2.length === 0);
    assert(ret.testObj2, { name: 'zongyu', finalField: '321' });
    assert(Array.from(ret.map1.keys())[0].toNumber() === 1000);
    assert(Array.from(ret.map1.values())[0] === 2);
    const obj = ProtoObj.toObject(ret, {
      enums: String,
    });
    assert(Array.from(obj.map1.values())[0] === 'C');
  });

  it('should hack / restore ok', () => {
    protobuf.restore();
    assert.throws(() => {
      protobuf.loadAll(protoPath);
    }, /illegal token 'import'/);
    protobuf.hack();

    const root = protobuf.loadAll(protoPath);
    assert(root);
    const ProtoObj = root.lookup('com.protobuf.test.service.ProtoObj');
    assert(ProtoObj);
  });
});
