const startTime = Date.now();

const schema = require('./src/schema');
const express = require('express');

const app = express();

app.use(require('body-parser').json());

function main() {
  const gql = require('graphql');
  const gqlTools = require('graphql-tools');

  const _schema = gqlTools.makeExecutableSchema(schema.graphql.getDefinition());

  app.use('/api', (req, res, next) => {
    const query = req.body.query || req.query.body;

    gql.graphql(_schema, query, null, { req })
      .then(response => {
        res.json(response);
      })
      .catch(e => {
        console.log(e.stack);
        next(e);
      });
  });

  const port = process.env.PORT || 8081;

  app.listen(port, () => {
    console.log(`GraphQL: http://localhost:${port}/api (${(Date.now() - startTime) / 1000}ms)`);
  });
}

Promise.resolve()
  .then(() => schema.connect())
  .then(main)
  .catch(error => {
    console.log(error.stack);
    process.exit(1);
  });
