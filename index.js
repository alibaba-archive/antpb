'use strict';

const fs = require('fs');
const glob = require('glob');
const encoder = require('./lib/encoder');
const decoder = require('./lib/decoder');
const converter = require('./lib/converter');
const parse = require('./lib/parse');
const protobuf = require('protobufjs');
const common = protobuf.common;
const Type = protobuf.Type;
const Root = protobuf.Root;
const Reader = protobuf.Reader;
const Writer = protobuf.Writer;
const util = protobuf.util;
const verifier = protobuf.verifier;
const wrappers = protobuf.wrappers;

const originalSetup = Type.prototype.setup;
const originGenerateConstructor = Type.generateConstructor;

// for benchmark use
exports.hack = () => {
  /**
   * Sets up {@link Type#encode|encode}, {@link Type#decode|decode} and {@link Type#verify|verify}.
   * @return {Type} `this`
   */
  Type.prototype.setup = function setup() {
    // Sets up everything at once so that the prototype chain does not have to be re-evaluated
    // multiple times (V8, soft-deopt prototype-check).

    const fullName = this.fullName;
    const types = [];
    for (let i = 0; i < /* initializes */ this.fieldsArray.length; ++i) {
      types.push(this._fieldsArray[i].resolve().resolvedType);
    }

    // Replace setup methods with type-specific generated functions
    this.encode = encoder(this)({
      Writer,
      types,
      util,
    });
    this.decode = decoder(this)({
      Reader,
      types,
      util,
    });
    this.verify = verifier(this)({
      types,
      util,
    });
    this.fromObject = converter.fromObject(this)({
      types,
      util,
    });
    this.toObject = converter.toObject(this)({
      types,
      util,
    });

    // Inject custom wrappers for common types
    const wrapper = wrappers[fullName];
    if (wrapper) {
      const originalThis = Object.create(this);
      // if (wrapper.fromObject) {
      originalThis.fromObject = this.fromObject;
      this.fromObject = wrapper.fromObject.bind(originalThis);
      // }
      // if (wrapper.toObject) {
      originalThis.toObject = this.toObject;
      this.toObject = wrapper.toObject.bind(originalThis);
      // }
    }

    return this;
  };

  /**
   * Generates a constructor function for the specified type.
   * @param {Type} mtype Message type
   * @return {Codegen} Codegen instance
   */
  Type.generateConstructor = mtype => {
    const gen = util.codegen([ 'p' ], mtype.name);
    // explicitly initialize mutable object/array fields so that these aren't just inherited from the prototype
    for (let i = 0, field; i < mtype.fieldsArray.length; ++i) {
      if ((field = mtype._fieldsArray[i]).map) {
        gen('this%s=new Map()', util.safeProp(field.name));
      } else if (field.repeated) {
        gen('this%s=[]', util.safeProp(field.name));
      }
    }
    return gen('if(p)for(var ks=Object.keys(p),i=0;i<ks.length;++i)if(p[ks[i]]!=null)')('this[ks[i]]=p[ks[i]]');
  };

  Root._configure(Type, parse, common);
};

exports.restore = () => {
  Type.prototype.setup = originalSetup;
  Type.generateConstructor = originGenerateConstructor;
  Root._configure(Type, protobuf.parse, common);
};

exports.loadAll = (protoPath, options) => {
  if (!fs.existsSync(protoPath)) {
    return null;
  }
  const root = new Root();
  const allProtoFiles = glob.sync('**/*.proto', {
    cwd: protoPath,
    absolute: true,
  });
  if (!allProtoFiles.length) {
    return null;
  }
  root.loadSync(allProtoFiles, options);
  return root;
};

exports.hack();
exports.fromJSON = Root.fromJSON;
exports.protobuf = protobuf;
