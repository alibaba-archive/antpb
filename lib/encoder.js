'use strict';

/* eslint-disable no-bitwise */
const Enum = require('protobufjs/src/enum');
const types = require('protobufjs/src/types');
const util = require('protobufjs/src/util');

/**
 * Generates a partial message type encoder.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} ref Variable reference
 * @return {Codegen} Codegen instance
 * @ignore
 */
function genTypePartial(gen, field, fieldIndex, ref) {
  return field.resolvedType.group ?
    gen('types[%i].encode(%s,w.uint32(%i)).uint32(%i)', fieldIndex, ref, (field.id << 3 | 3) >>> 0, (field.id << 3 | 4) >>> 0) :
    gen('types[%i].encode(%s,w.uint32(%i).fork()).ldelim()', fieldIndex, ref, (field.id << 3 | 2) >>> 0);
}

/**
 * Generates an encoder specific to the specified message type.
 * @param {Type} mtype Message type
 * @return {Codegen} Codegen instance
 */
function encoder(mtype) {
  const gen = util.codegen([ 'm', 'w' ], mtype.name + '$encode')('if(!w)')('w=Writer.create()');
  let ref;

  // "when a message is serialized its known fields should be written sequentially by field number"
  const fields = /* initializes */ mtype.fieldsArray.slice().sort(util.compareFieldsById);

  for (let i = 0; i < fields.length; ++i) {
    const field = fields[i].resolve();
    const index = mtype._fieldsArray.indexOf(field);
    const type = field.resolvedType instanceof Enum ? 'int32' : field.type;
    const wireType = types.basic[type];
    ref = 'm' + util.safeProp(field.name);

    // Map fields
    if (field.map) {
      gen('if(%s && %s[Symbol.iterator]){', ref, ref)('for(var k of %s.keys()) {', ref)('w.uint32(%d).fork().uint32(%d).%s(k)', (field.id << 3 | 2) >>> 0, 8 | types.mapKey[field.keyType], field.keyType);
      if (wireType === undefined) {
        gen('types[%d].encode(%s.get(k),w.uint32(18).fork()).ldelim().ldelim()', index, ref); // can't be groups
      } else {
        gen('.uint32(%d).%s(%s.get(k)).ldelim()', 16 | wireType, type, ref);
      }
      gen('}');
      gen('} else if(%s!=null&&m.hasOwnProperty(%j)){', ref, field.name)('for(var ks=Object.keys(%s),i=0;i<ks.length;++i){', ref)('w.uint32(%i).fork().uint32(%i).%s(ks[i])', (field.id << 3 | 2) >>> 0, 8 | types.mapKey[field.keyType], field.keyType);
      if (wireType === undefined) {
        gen('types[%i].encode(%s[ks[i]],w.uint32(18).fork()).ldelim().ldelim()', index, ref); // can't be groups
      } else {
        gen('.uint32(%i).%s(%s[ks[i]]).ldelim()', 16 | wireType, type, ref);
      }
      gen('}')('}');

      // Repeated fields
    } else if (field.repeated) {
      gen('if(%s!=null&&%s.length){', ref, ref); // !== undefined && !== null

      // Packed repeated
      if (field.packed && types.packed[type] !== undefined) {
        gen('w.uint32(%i).fork()', (field.id << 3 | 2) >>> 0)('for(var i=0;i<%s.length;++i)', ref)('w.%s(%s[i])', type, ref)('w.ldelim()');

        // Non-packed
      } else {
        gen('for(var i=0;i<%s.length;++i)', ref);
        if (wireType === undefined) { genTypePartial(gen, field, index, ref + '[i]'); } else gen('w.uint32(%i).%s(%s[i])', (field.id << 3 | wireType) >>> 0, type, ref);

      }
      gen('}');

      // Non-repeated
    } else {
      if (field.optional) gen('if(%s!=null&&m.hasOwnProperty(%j))', ref, field.name); // !== undefined && !== null

      if (wireType === undefined) { genTypePartial(gen, field, index, ref); } else gen('w.uint32(%i).%s(%s)', (field.id << 3 | wireType) >>> 0, type, ref);

    }
  }

  return gen('return w');
}

module.exports = encoder;
/* eslint-enable no-bitwise */
