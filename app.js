'use strict';

const db = require('./src/schema/models');

const JST = require('json-schema-to');
const app = require('express')();

app.use(require('body-parser').json());
app.use(require('jsonschema-form-mw')(db));

const _schemas = db.schemas;

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

  const jsf = require('json-schema-faker');

  const resolvers = {
    Cart() {
      return jsf(_jst.$refs.Cart, _schemas);
    },
    Product() {
      return jsf(_jst.$refs.Product, _schemas);
    },
  };

  const typeDefs = [
    baseSchema,
    modelSchema,
  ];

  const gql = require('graphql');
  const gqltools = require('graphql-tools');

  const _schema = gqltools.makeExecutableSchema({ typeDefs });

  app.use('/api', (req, res, next) => {
    const query = req.body.query || req.query.body;

    gql.graphql(_schema, query, resolvers)
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
  .then(() => JST.load(_schemas).then(_bundle => JST.merge('webapp', _bundle)))
  .then(main)
  .catch(error => {
    console.log(error.stack);
    process.exit(1);
  });

process.on('exit', () => {
  db.close();
});
