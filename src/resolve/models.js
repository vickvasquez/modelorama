'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');
const Resolver = require('sastre').Resolver;
const path = require('path');

class ModelsResolver {
  constructor(container, options) {
    const refs = JSONSchemaSequelizer.refs(path.resolve(options.directory, '..'), 'types');

    const db = this.database = new JSONSchemaSequelizer(options.settings.use_env_variable
      ? process.env[options.settings.use_env_variable]
      : options.settings, refs);

    this.repository = new Resolver(container, options.directory, {
      before(name, definition) {
        if (definition.$schema) {
          db.add(definition);
          return;
        }

        const attributes = definition.attributes;
        const options = definition.options;

        delete definition.attributes;
        delete definition.options;

        const fixedOptions = Object.assign({}, options, definition);

        return db.sequelize.define(name, definition.attributes || {}, fixedOptions);
      },
      after(name, definition) {
        let target = definition;

        if (definition.$schema) {
          target = db.models[name];
        }

        if (definition.hooks) {
          Object.keys(definition.hooks).forEach(hook => {
            target.hook(hook, definition.hooks[hook]);
          });
        }

        Object.assign(target, definition.classMethods);
        Object.assign(target.prototype, definition.instanceMethods);

        delete definition.hooks;
        delete definition.classMethods;
        delete definition.instanceMethods;

        return target;
      },
    });
  }

  connect() {
    return this.database.connect();
  }

  get(name) {
    return this.repository.get(name);
  }
}

module.exports = ModelsResolver;
