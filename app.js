'use strict';

const db = require('./src/schema/models');
const app = require('express')();

db.connect()
  .then(() => {
    app.use(require('body-parser').json());
    app.use(require('jsonschema-form-mw')(db));

    const port = process.env.PORT || 8081;

    app.listen(port, () => {
      console.log(`Listening at http://localhost:${port}/db`);
    });
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });

process.on('exit', () => {
  db.close();
});
