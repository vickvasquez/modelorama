'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

const db = require('./src/models');
const app = require('express')();

db.connect()
  .then(() => {
    app.use(require('body-parser').json());

    const dbHook = require('jsonschema-form-mw');

    app.use(require('serve-static')(dbHook.publicDir));

    app.all('/db/:model?/:action?/:id?', (req, res) => {
      const isJSON = /application\/.*json/.test(req.headers.accept);

      const Model = db.models[req.params.model];

      const opts = {
        url(modelName, action) {
          const pk = db.models[modelName].primaryKeyAttribute;

          return !action
            ? `/db/${modelName}`
            : `/db/${modelName}/${action === 'new' ? action : `${action}/:${pk}`}`;
        },
        method: req.body._method || req.method,
        resource: Model ? JSONSchemaSequelizer.resource(db.$refs, Model, {
          [Model ? Model.primaryKeyAttribute : undefined]: req.params.id || undefined,
          attachments: Model ? dbHook.buildAttachments(Model, __dirname, 'tmp') : [],
          payload: req.body.payload,
          where: req.body.where,
        }) : undefined,
        action: req.params.action,
        fieldId: req.params.id,
        modelName: req.params.model,
        modelNames: Object.keys(db.models),
        modelInstance: Model,
      };

      dbHook(opts, isJSON)
        .then(data => {
          if (!isJSON) {
            if (!opts.resource) {
              res.send(`<ul><li>${data.map(x => `<a href="/db/${x}">${x}</a>`).join('</li><li>')}</li></ul>`);
              return;
            }

            res.send([
              `<html><head><link rel="stylesheet" href="/styles.css"/></head>`,
              `<body><script type="application/json" data-component="jsonschema-form">${JSON.stringify(data)}</script>`,
              `<script src="/main.js"></script></body></html>`,
            ].join(''));
            return;
          }

          res.json(data);
        })
        .catch(e => {
          if (isJSON) {
            res.json({
              result: e,
            });
            return;
          }

          res.send(e.toString());
        });
    });

    app.listen(3001, () => {
      console.log('Listening at http://localhost:3001');
    });
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
