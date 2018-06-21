'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const config = require('../../../config.js');

const refs = JSONSchemaSequelizer.refs(path.join(__dirname, '..'), 'types');

const db = new JSONSchemaSequelizer(config.use_env_variable
  ? process.env[config.use_env_variable]
  : config, refs);

JSONSchemaSequelizer.scan(__dirname)
  .forEach(modelDefinition => {
    const functions = path.join(__dirname, `../../api/models/${modelDefinition.$schema.id}.js`);
    const definition = fs.existsSync(functions)
      ? require(functions)
      : {};

    const model = _.merge({}, modelDefinition, definition);

    Object.defineProperty(db, model.$schema.id, {
      get() {
        return db.models[model.$schema.id];
      },
    });

    db.add(model);
  });

module.exports = db;
