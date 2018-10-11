const { Resolver } = require('sastre');
const fs = require('fs');
const path = require('path');

class GraphQLResolver {
  constructor(container, options) {
    this.repository = new Resolver(container, options.directory);

    let _schema;

    Object.defineProperty(this, '_schema', {
      enumerable: false,
      get: () => {
        if (!_schema) {
          const schemaCommon = path.resolve(__dirname, '../schema/common.gql');
          const schemaIndex = path.resolve(__dirname, '../schema/_generated/index.gql');

          const typeDefs = [
            schemaCommon,
            schemaIndex,
          ].map(file => fs.readFileSync(file, 'utf8'));

          _schema = GraphQLResolver.loadSchema(this.repository, typeDefs);
        }

        return _schema;
      }
    });
  }

  static loadSchema(repo, typeDefs) {
    const resolvers = {
      Mutation: {},
      Query: {},
    };

    Object.keys(repo.registry).forEach(name => {
      const target = repo.get(name);

      Object.keys(resolvers).forEach(method => {
        Object.keys(target[method] || {}).forEach(prop => {
          if (typeof target[method][prop] === 'function') {
            resolvers[method][prop] = function call(root, args, ctx) {
              let response;

              return Promise.resolve()
                .then(() => target[method][prop](args, ctx.req))
                .then(_response => {
                  response = _response;

                  return response;
                })
                .catch(error => {
                  const _err = error.originalError || error;

                  if (_err instanceof Error) {
                    throw _err;
                  }

                  if (!(_err.original && _err.original.errno)) {
                    throw new Error(_err.description || _err.message);
                  }

                  throw new Error(`${_err.description || _err.message} (${_err.original.errno})`);
                })
            };
          }
        });
      });
    });

    return {
      typeDefs,
      resolvers,
    };
  }

  getDefinition() {
    return this._schema;
  }

  get(name) {
    return this.repository.get(name);
  }
}

module.exports = GraphQLResolver;
