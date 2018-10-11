const { Resolver } = require('sastre');
const path = require('path');
const jsf = require('json-schema-faker');
const JSONSchemaSequelizer = require('json-schema-sequelizer');

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

          target.fake = target.fakeOne = () =>
            jsf.generate(definition.$schema, db.$refs);

          target.fakeAll = () =>
            jsf.generate({
              type: 'array',
              items: definition.$schema,
            }, db.$refs);
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

  close() {
    return this.database.close();
  }

  get(name) {
    return this.repository.get(name);
  }
}

module.exports = ModelsResolver;
