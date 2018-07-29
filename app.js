'use strict';

const db = require('./src/schema/models');

const JST = require('json-schema-to');
const app = require('express')();

async function main() {
  await db.connect();

  const { ApolloServer } = require('apollo-server-express');

  const _schemas = db.schemas;
  const _bundle = await JST.load(_schemas);
  const _jst = JST.merge('webapp', _bundle);

  const modelSchema = _jst.graphql;
  const baseSchema = `
    type Query {
      dummy: [String]
    }
    type Mutation {
      dummy: [String]
    }
    schema {
      query: Query
      mutation: Mutation
    }
  `;

  const jsf = require('json-schema-faker');

  const {
    Cart, CartList, Product, ProductList,
  } = _jst.$refs;

  const resolvers = {
    Mutation: {},
    Query: {
      Cart() {
        return jsf(Cart, _schemas);
      },
    },
  };

  const typeDefs = [
    baseSchema,
    modelSchema,
  ];

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: req => req,
    formatError: error => _.omit(error, ['locations']),
  });

  server.applyMiddleware({
    app,
    path: '/api',
  });

  app.use(require('body-parser').json());
  app.use(require('jsonschema-form-mw')(db));

  const port = process.env.PORT || 8081;

  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/db`);
    console.log(`GraphQL: http://localhost:${port}/api`);
  });
}

Promise.resolve()
  .then(() => main())
  .catch(error => {
    console.log(error);
    process.exit(1);
  });

process.on('exit', () => {
  db.close();
});
