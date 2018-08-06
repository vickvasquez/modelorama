'use strict';

const schema = require('./src/schema');
const app = require('express')();

const db = schema.models.database;

app.use(require('body-parser').json());
app.use(require('jsonschema-form-mw')(db));

function main() {
  const gql = require('graphql');
  const gqltools = require('graphql-tools');

  const _definition = schema.graphql.getDefinition();
  const _schema = gqltools.makeExecutableSchema(_definition);

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
    console.log(`Listening at http://localhost:${port}/db`);
    console.log(`GraphQL: http://localhost:${port}/api`);
  });
}

Promise.resolve()
  .then(() => schema.connect())
  .then(main)
  .catch(error => {
    console.log(error.stack);
    process.exit(1);
  });

process.on('exit', () => {
  db.close();
});
