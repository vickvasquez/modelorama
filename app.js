'use strict';

const Service = require('json-schema-to').Service;

const app = require('express')();
const db = require('./src/schema/models');

app.use(require('body-parser').json());
app.use(require('jsonschema-form-mw')(db));

const _schemas = db.schemas;

const jsf = require('json-schema-faker');

function main(_jst) {
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

  const resolvers = {
    Query: {
      Cart: () => jsf(_jst.$refs.Cart, _schemas),
      Product: () => jsf(_jst.$refs.Product, _schemas),
      Carts: () => jsf(_jst.$refs.CartList, _schemas),
      Products: () => jsf(_jst.$refs.ProductList, _schemas),
    },
  };

  const typeDefs = [
    baseSchema,
    modelSchema,
  ];

  const gql = require('graphql');
  const gqltools = require('graphql-tools');

  // const gqlsequelize = require('graphql-sequelize');

  // resolvers.Query.Cart = gqlsequelize.resolver(db.models.Cart);
  // resolvers.Query.Carts = gqlsequelize.resolver(db.models.Cart, { list: true });

  // resolvers.Query.Product = gqlsequelize.resolver(db.models.Product);
  // resolvers.Query.Products = gqlsequelize.resolver(db.models.Product, { list: true });

  const _schema = gqltools.makeExecutableSchema({ typeDefs, resolvers });

  app.use('/api', (req, res, next) => {
    const query = req.body.query || req.query.body;

    gql.graphql(_schema, query, {})
      .then(response => {
        res.json(response);
      })
      .catch(next);
  });

  const port = process.env.PORT || 8081;

  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/db`);
    console.log(`GraphQL: http://localhost:${port}/api`);
  });
}

Promise.resolve()
  .then(() => db.connect())
  .then(() => Service.load(_schemas).then(_bundle => Service.merge('webapp', _bundle)))
  .then(main)
  .catch(error => {
    console.log(error.stack);
    process.exit(1);
  });

process.on('exit', () => {
  db.close();
});
