'use strict';

// const log = require('../../logger').createLogger(__filename);

const Resolver = require('sastre').Resolver;

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class GraphQLResolver {
  constructor(container, options) {
    this.repository = new Resolver(container, options.directory);
  }

  use(app, prefix) {
    const schemaCommon = path.resolve(__dirname, '../../../schema/common.gql');
    const schemaIndex = path.resolve(__dirname, '../../../schema/generated/index.gql');

    const typeDefs = [
      schemaCommon,
      schemaIndex,
    ].map(file => fs.readFileSync(file, 'utf8'));

    const resolvers = {
      Mutation: {},
      Query: {},
    };

    Object.keys(this.repository.registry).forEach(name => {
      const target = this.repository.get(name);

      Object.keys(resolvers).forEach(method => {
        Object.keys(target[method] || {}).forEach(prop => {
          if (typeof target[method][prop] === 'function') {
            resolvers[method][prop] = function call(root, args, ctx) {
              log.message(`${name}.${prop}`, { request: args }, ctx.req.guid);

              let response;

              return Promise.resolve()
                .then(() => target[method][prop]({ root, args, req: ctx.req }))
                .then(_response => {
                  response = _response;

                  log.message(`${name}.${prop}`, { response }, ctx.req.guid);

                  return response;
                })
                .catch(error => {
                  log.exception(error.originalError || error, `${name}.${prop}`, { response }, ctx.req.guid);

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

    const ApolloServer = require('apollo-server-express').ApolloServer;

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: req => req,
      formatError: error => _.omit(error, ['locations']),
    });

    server.applyMiddleware({
      app,
      path: prefix,
    });
  }

  get(name) {
    return this.repository.get(name);
  }
}

module.exports = GraphQLResolver;
