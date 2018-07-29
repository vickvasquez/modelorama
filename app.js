'use strict';

const db = require('./src/schema/models');

const JST = require('json-schema-to');
const app = require('express')();

const _schemas = db.schemas;

function main(_jst) {
  const ApolloServer = require('apollo-server-express').ApolloServer;

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

  const Cart = _jst.$refs.Cart;
  const CartList = _jst.$refs.CartList;
  const Product = _jst.$refs.Product;
  const ProductList = _jst.$refs.ProductList;

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
  .then(() => db.connect())
  .then(() => {
    return JST.load(_schemas).then(_bundle => JST.merge('webapp', _bundle))
  })
  .then(() => main())
  .catch(error => {
    console.log(error.stack);
    process.exit(1);
  });

process.on('exit', () => {
  db.close();
});
