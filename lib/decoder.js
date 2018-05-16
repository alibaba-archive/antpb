'use strict';

const Enum = require('protobufjs/src/enum');
const types = require('protobufjs/src/types');
const util = require('protobufjs/src/util');

function missing(field) {
  return `missing required '${field.name}'`;
}

/**
 * Generates a decoder specific to the specified message type.
 * @param {Type} mtype Message type
 * @return {Codegen} Codegen instance
 */
function decoder(mtype) {
  const gen = util.codegen([ 'r', 'l' ], mtype.name + '$decode')('if(!(r instanceof Reader))')('r=Reader.create(r)')('var c=l===undefined?r.len:r.pos+l,m=new this.ctor' + (mtype.fieldsArray.filter(field => field.map).length ? ',k' : ''))('while(r.pos<c){')('var t=r.uint32()');

  if (mtype.group) {
    gen('if((t&7)===4)')('break');
  }
  gen('switch(t>>>3){');

  for (let i = 0; i < /* initializes */ mtype.fieldsArray.length; ++i) {
    const field = mtype._fieldsArray[i].resolve();
    const type = field.resolvedType instanceof Enum ? 'int32' : field.type;
    const ref = 'm' + util.safeProp(field.name);
    gen('case %i:', field.id);

    // Map fields
    if (field.map) {
      gen('r.skip().pos++')('if(%s===util.emptyObject)', ref)('%s=new Map()', ref)('k=r.%s()', field.keyType)('r.pos++'); // assumes id 2 + value wireType
      // NOTE: 原来这里将 Long 对象转换成 hash 字符串是因为 Object 的 key 只能是字符串，现在用 Map 来实现后就让它原样输出就好了
      // if (types.long[field.keyType] !== undefined) {
      //   if (types.basic[type] === undefined) {
      //     gen('%s.set(typeof k==="object"?util.longToHash(k):k, types[%i].decode(r,r.uint32()));', ref, i); // can't be groups
      //   } else {
      //     gen('%s.set(typeof k==="object"?util.longToHash(k):k, r.%s());', ref, type);
      //   }
      // } else {
      if (types.basic[type] === undefined) {
        gen('%s.set(k, types[%i].decode(r,r.uint32()));', ref, i); // can't be groups
      } else {
        gen('%s.set(k, r.%s());', ref, type);
      }
      // }
      // Repeated fields
    } else if (field.repeated) {
      gen('if(!(%s&&%s.length))', ref, ref)('%s=[]', ref);

      // Packable (always check for forward and backward compatiblity)
      if (types.packed[type] !== undefined) {
        gen('if((t&7)===2){')('var c2=r.uint32()+r.pos')('while(r.pos<c2)')('%s.push(r.%s())', ref, type)('}else');
      }

      // Non-packed
      if (types.basic[type] === undefined) {
        gen(field.resolvedType.group ? '%s.push(types[%i].decode(r))' : '%s.push(types[%i].decode(r,r.uint32()))', ref, i);
      } else {
        gen('%s.push(r.%s())', ref, type);
      }
      // Non-repeated
    } else if (types.basic[type] === undefined) {
      gen(field.resolvedType.group ? '%s=types[%i].decode(r)' : '%s=types[%i].decode(r,r.uint32())', ref, i);
    } else {
      gen('%s=r.%s()', ref, type);
    }
    gen('break');
    // Unknown fields
  }
  gen('default:')('r.skipType(t&7)')('break')('}')('}');

  // Field presence
  for (let i = 0; i < mtype._fieldsArray.length; ++i) {
    const rfield = mtype._fieldsArray[i];
    if (rfield.required) {
      gen('if(!m.hasOwnProperty(%j))', rfield.name)('throw util.ProtocolError(%j,{instance:m})', missing(rfield));
    }
  }

  return gen('return m');
}

module.exports = decoder;
