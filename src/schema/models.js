'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const config = require('../../config.js');

const refs = JSONSchemaSequelizer.refs(__dirname, 'types');

const db = new JSONSchemaSequelizer(config.use_env_variable
  ? process.env[config.use_env_variable]
  : config, refs);

fs
  .readdirSync(path.join(__dirname, 'models'))
  .filter(file => file.indexOf('.json') !== -1)
  .forEach(file => {
    const name = path.basename(file, '.json');
    const $schema = require(path.join(__dirname, 'models', name));
    const functions = path.join(__dirname, `../api/models/${name}.js`);
    const definition = fs.existsSync(functions)
      ? require(functions)
      : {};

    const model = _.merge({ $schema }, definition);

    if (!model.$schema.id) {
      model.$schema.id = name;
    }

    Object.defineProperty(db, model.$schema.id, {
      get() {
        return db.models[model.$schema.id];
      },
    });

    db.add(model);
  });

module.exports = db;
