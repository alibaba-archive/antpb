'use strict';

const Enum = require('protobufjs/src/enum');
const util = require('protobufjs/src/util');

const converter = exports;

/**
 * Generates a partial value fromObject conveter.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} prop Property reference
 * @return {Codegen} Codegen instance
 * @ignore
 */
function genValuePartial_fromObject(gen, field, fieldIndex, prop) {
  if (field.resolvedType) {
    if (field.resolvedType instanceof Enum) {
      gen('switch(d%s){', prop);
      for (let values = field.resolvedType.values, keys = Object.keys(values), i = 0; i < keys.length; ++i) {
        if (field.repeated && values[keys[i]] === field.typeDefault) gen('default:');
        gen('case%j:', keys[i])('case %i:', values[keys[i]])('m%s=%j', prop, values[keys[i]])('break');
      }
      gen('}');
    } else {
      gen('if(typeof d%s!=="object")', prop)('throw TypeError(%j)', field.fullName + ': object expected')('m%s=types[%i].fromObject(d%s)', prop, fieldIndex, prop);
    }
  } else {
    let isUnsigned = false;
    switch (field.type) {
      case 'double':
      case 'float':
        gen('m%s=Number(d%s)', prop, prop); // also catches "NaN", "Infinity"
        break;
      case 'uint32':
      case 'fixed32':
        gen('m%s=d%s>>>0', prop, prop);
        break;
      case 'int32':
      case 'sint32':
      case 'sfixed32':
        gen('m%s=d%s|0', prop, prop);
        break;
      case 'uint64':
        isUnsigned = true;
        // eslint-disable-line no-fallthrough
      case 'int64':
      case 'sint64':
      case 'fixed64':
      case 'sfixed64':
        gen('if(util.Long)')('(m%s=util.Long.fromValue(d%s)).unsigned=%j', prop, prop, isUnsigned)('else if(typeof d%s==="string")', prop)('m%s=parseInt(d%s,10)', prop, prop)('else if(typeof d%s==="number")', prop)('m%s=d%s', prop, prop)('else if(typeof d%s==="object")', prop)('m%s=new util.LongBits(d%s.low>>>0,d%s.high>>>0).toNumber(%s)', prop, prop, prop, isUnsigned ? 'true' : '');
        break;
      case 'bytes':
        gen('if(typeof d%s==="string")', prop)('util.base64.decode(d%s,m%s=util.newBuffer(util.base64.length(d%s)),0)', prop, prop, prop)('else if(d%s.length)', prop)('m%s=d%s', prop, prop);
        break;
      case 'string':
        gen('m%s=String(d%s)', prop, prop);
        break;
      case 'bool':
        gen('m%s=Boolean(d%s)', prop, prop);
        break;
      default:
        break;
        /* default: gen
            ("m%s=d%s", prop, prop);
            break; */
    }
  }
  return gen;
}

function genMapValuePartial_fromObject(gen, field, fieldIndex, prop) {
  if (field.resolvedType) {
    if (field.resolvedType instanceof Enum) {
      gen('switch(d%s.get(k)){', prop);
      for (let values = field.resolvedType.values, keys = Object.keys(values), i = 0; i < keys.length; ++i) {
        if (field.repeated && values[keys[i]] === field.typeDefault) {
          gen('default:');
        }
        gen('case%j:', keys[i])('case %i:', values[keys[i]])('m%s.set(k, %j);', prop, values[keys[i]])('break;');
      }
      gen('}');
    } else {
      gen('if(typeof d%s.get(k)!=="object")', prop)('throw TypeError(%j)', field.fullName + ': object expected')('m%s.set(k, types[%i].fromObject(d%s.get(k)))', prop, fieldIndex, prop);
    }
  } else {
    let isUnsigned = false;
    switch (field.type) {
      case 'double':
      case 'float':
        gen('m%s.set(k, Number(d%s.get(k)));', prop, prop); // also catches "NaN", "Infinity"
        break;
      case 'uint32':
      case 'fixed32':
        gen('m%s.set(k, d%s.get(k)>>>0);', prop, prop);
        break;
      case 'int32':
      case 'sint32':
      case 'sfixed32':
        gen('m%s.set(k, d%s.get(k)|0);', prop, prop);
        break;
      case 'uint64':
        isUnsigned = true;
        // eslint-disable-line no-fallthrough
      case 'int64':
      case 'sint64':
      case 'fixed64':
      case 'sfixed64':
        gen('if(util.Long){')('var l = util.Long.fromValue(d%s);', prop)('l.unsigned=%j;', isUnsigned)('m%s.set(k, l);', prop)('}else if(typeof d%s==="string"){', prop)('m%s.set(k, parseInt(d%s.get(k),10));', prop, prop)('}else if(typeof d%s==="number"){', prop)('m%s.set(k, d%s.get(k));', prop, prop)('}else if(typeof d%s==="object"){', prop)('m%s.set(k, new util.LongBits(d%s.get(k).low>>>0,d%s.get(k).high>>>0).toNumber(%s));', prop, prop, prop, isUnsigned ? 'true' : '')('}');
        break;
      case 'bytes':
        gen('if(typeof d%s.get(k)==="string"){', prop)('var b = util.newBuffer(util.base64.length(d%s.get(k)));', prop)('util.base64.decode(d%s.get(k),b,0)', prop)('m%s.set(k, b);', prop)('}else if(d%s.get(k).length){', prop)('m%s.set(k,d%s.get(k));', prop, prop)('}');
        break;
      case 'string':
        gen('m%s.set(k,String(d%s.get(k)))', prop, prop);
        break;
      case 'bool':
        gen('m%s.set(k,Boolean(d%s.get(k)))', prop, prop);
        break;
      default:
        break;
        /* default: gen
            ("m%s=d%s", prop, prop);
            break; */
    }
  }
  return gen;
}

/**
 * Generates a plain object to runtime message converter specific to the specified message type.
 * @param {Type} mtype Message type
 * @return {Codegen} Codegen instance
 */
converter.fromObject = function fromObject(mtype) {
  const fields = mtype.fieldsArray;
  const gen = util.codegen([ 'd' ], mtype.name + '$fromObject')('if(d instanceof this.ctor){')('return d;')('}');
  if (!fields.length) return gen('return new this.ctor');
  gen('var m=new this.ctor');
  for (let i = 0; i < fields.length; ++i) {
    const field = fields[i].resolve();
    const prop = util.safeProp(field.name);

    // Map fields
    if (field.map) {
      gen('if(d%s){', prop)('if(Object.prototype.toString.call(d%s) !=="[object Map]")', prop)('throw TypeError(%j)', field.fullName + ': es6 Map expected')('m%s=new Map();', prop)('for(var k of d%s.keys()){', prop);
      genMapValuePartial_fromObject(gen, field, /* not sorted */ i, prop)('}')('}');
      // Repeated fields
    } else if (field.repeated) {
      gen('if(d%s){', prop)('if(!Array.isArray(d%s))', prop)('throw TypeError(%j)', field.fullName + ': array expected')('m%s=[]', prop)('for(var i=0;i<d%s.length;++i){', prop);
      genValuePartial_fromObject(gen, field, /* not sorted */ i, prop + '[i]')('}')('}');
      // Non-repeated fields
    } else {
      if (!(field.resolvedType instanceof Enum)) {
        gen('if(d%s!=null){', prop);
      } // !== undefined && !== null
      genValuePartial_fromObject(gen, field, /* not sorted */ i, prop);
      if (!(field.resolvedType instanceof Enum)) gen('}');
    }
  }
  return gen('return m');
};

/**
 * Generates a partial value toObject converter.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} prop Property reference
 * @param {bool} map whether is a map
 * @return {Codegen} Codegen instance
 * @ignore
 */
function genValuePartial_toObject(gen, field, fieldIndex, prop, map) {
  if (field.resolvedType) {
    if (field.resolvedType instanceof Enum) {
      if (map) {
        gen('d%s.set(k, o.enums===String?types[%i].values[m%s.get(k)]:m%s.get(k));', prop, fieldIndex, prop, prop);
      } else {
        gen('d%s=o.enums===String?types[%i].values[m%s]:m%s', prop, fieldIndex, prop, prop);
      }
    } else {
      if (map) {
        gen('d%s.set(k, types[%i].toObject(m%s.get(k),o));', prop, fieldIndex, prop);
      } else {
        gen('d%s=types[%i].toObject(m%s,o)', prop, fieldIndex, prop);
      }
    }
  } else {
    let isUnsigned = false;
    switch (field.type) {
      case 'double':
      case 'float':
        if (map) {
          gen('d%s.set(k, o.json&&!isFinite(m%s.get(k))?String(m%s.get(k)):m%s.get(k));', prop, prop, prop, prop);
        } else {
          gen('d%s=o.json&&!isFinite(m%s)?String(m%s):m%s;', prop, prop, prop, prop);
        }
        break;
      case 'uint64':
        isUnsigned = true;
        // eslint-disable-line no-fallthrough
      case 'int64':
      case 'sint64':
      case 'fixed64':
      case 'sfixed64':
        if (map) {
          gen('if(typeof m%s==="number"){', prop)('d%s.set(k, o.longs===String?String(m%s.get(k)):m%s.get(k));', prop, prop, prop)('} else {')('d%s.set(k, o.longs===String?util.Long.prototype.toString.call(m%s.get(k)):o.longs===Number?new util.LongBits(m%s.get(k).low>>>0,m%s.get(k).high>>>0).toNumber(%s):m%s.get(k));', prop, prop, prop, prop, isUnsigned ? 'true' : '', prop)('}');
        } else {
          gen('if(typeof m%s==="number"){', prop)('d%s=o.longs===String?String(m%s):m%s;', prop, prop, prop)('} else {')('d%s=o.longs===String?util.Long.prototype.toString.call(m%s):o.longs===Number?new util.LongBits(m%s.low>>>0,m%s.high>>>0).toNumber(%s):m%s', prop, prop, prop, prop, isUnsigned ? 'true' : '', prop)('}');
        }
        break;
      case 'bytes':
        if (map) {
          gen('d%s.set(k, o.bytes===String?util.base64.encode(m%s.get(k),0,m%s.get(k).length):o.bytes===Array?Array.prototype.slice.call(m%s.get(k)):m%s.get(k));', prop, prop, prop, prop, prop);
        } else {
          gen('d%s=o.bytes===String?util.base64.encode(m%s,0,m%s.length):o.bytes===Array?Array.prototype.slice.call(m%s):m%s', prop, prop, prop, prop, prop);
        }
        break;
      default:
        if (map) {
          gen('d%s.set(k, m%s.get(k));', prop, prop);
        } else {
          gen('d%s=m%s', prop, prop);
        }
        break;
    }
  }
  return gen;
}

/**
 * Generates a runtime message to plain object converter specific to the specified message type.
 * @param {Type} mtype Message type
 * @return {Codegen} Codegen instance
 */
converter.toObject = function toObject(mtype) {
  const fields = mtype.fieldsArray.slice().sort(util.compareFieldsById);
  if (!fields.length) {
    return util.codegen()('return {}');
  }
  const gen = util.codegen([ 'm', 'o' ], mtype.name + '$toObject')('if(!o)')('o={}')('var d={}');

  const repeatedFields = [];
  const mapFields = [];
  const normalFields = [];
  for (let i = 0; i < fields.length; ++i) {
    if (!fields[i].partOf) {
      (fields[i].resolve().repeated ? repeatedFields : fields[i].map ? mapFields : normalFields).push(fields[i]);
    }
  }

  if (repeatedFields.length) {
    gen('if(o.arrays||o.defaults){');
    for (let i = 0; i < repeatedFields.length; ++i) gen('d%s=[]', util.safeProp(repeatedFields[i].name));
    gen('}');
  }

  if (mapFields.length) {
    gen('if(o.objects||o.defaults){');
    for (let i = 0; i < mapFields.length; ++i) gen('d%s=new Map()', util.safeProp(mapFields[i].name));
    gen('}');
  }

  if (normalFields.length) {
    gen('if(o.defaults){');
    for (let i = 0; i < normalFields.length; ++i) {
      const field = normalFields[i];
      const prop = util.safeProp(field.name);
      if (field.resolvedType instanceof Enum) gen('d%s=o.enums===String?%j:%j', prop, field.resolvedType.valuesById[field.typeDefault], field.typeDefault);
      else if (field.long) {
        gen('if(util.Long){')('var n=new util.Long(%i,%i,%j)', field.typeDefault.low, field.typeDefault.high, field.typeDefault.unsigned)('d%s=o.longs===String?n.toString():o.longs===Number?n.toNumber():n', prop)('}else')('d%s=o.longs===String?%j:%i', prop, field.typeDefault.toString(), field.typeDefault.toNumber());
      } else if (field.bytes) gen('d%s=o.bytes===String?%j:%s', prop, String.fromCharCode.apply(String, field.typeDefault), '[' + Array.prototype.slice.call(field.typeDefault).join(',') + ']');
      else gen('d%s=%j', prop, field.typeDefault); // also messages (=null)
    }
    gen('}');
  }
  for (let i = 0; i < fields.length; ++i) {
    const field = fields[i];
    const index = mtype._fieldsArray.indexOf(field);
    const prop = util.safeProp(field.name);
    if (field.map) {
      gen('if(m%s&& m%s.size){', prop, prop)('d%s=new Map()', prop)('for(var k of m%s.keys()){', prop);
      genValuePartial_toObject(gen, field, /* sorted */ index, prop, true)('}');
    } else if (field.repeated) {
      gen('if(m%s&&m%s.length){', prop, prop)('d%s=[]', prop)('for(var j=0;j<m%s.length;++j){', prop);
      genValuePartial_toObject(gen, field, /* sorted */ index, prop + '[j]')('}');
    } else {
      gen('if(m%s!=null&&m.hasOwnProperty(%j)){', prop, field.name); // !== undefined && !== null
      genValuePartial_toObject(gen, field, /* sorted */ index, prop);
      if (field.partOf) {
        gen('if(o.oneofs)')('d%s=%j', util.safeProp(field.partOf.name), field.name);
      }
    }
    gen('}');
  }
  return gen('return d');
};
