'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

const db = require('./src/models');
const app = require('express')();

db.connect()
  .then(() => {
    const dbHook = require('jsonschema-form-mw');

    app.use('/jsonschema-form-mw', require('serve-static')(dbHook.publicDir));
    app.use(require('body-parser').json());

    app.all(/^\/db(\/.+?)?$/, (req, res) => {
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const parts = (req.params[0] || '/').substr(1).split('/');

      if (parts[0]) {
        req.params.model = parts.shift();
      }

      if (/^[a-z]+$/.test(parts[parts.length - 1])) {
        req.params.action = parts.pop();
      }

      req.params.keys = parts.filter(Boolean);

      if (req.params.keys[0]) {
        req.params.action = req.params.action || 'show';
      } else {
        req.params.action = req.method === 'GET' ? 'index' : 'create';
      }

      if (req.params.action === 'edit' && req.method === 'POST') {
        req.params.action = req.body._method === 'DELETE' ? 'destroy' : 'update';
      }

      const isJSON = /application\/.*json/.test(req.headers.accept);

      const Model = db.models[req.params.model];
      const pk = Model && Model.primaryKeyAttribute;

      if (req.method === 'OPTIONS') {
        res.end();
        return;
      }

      const opts = {
        url(modelName, action) {
          const _pk = db.models[modelName].primaryKeyAttribute;

          return !action
            ? `/db/${modelName}`
            : `/db/${modelName}/${action === 'new' ? action : `${action}/:${_pk}`}`;
        },
        resource: Model ? JSONSchemaSequelizer.resource(db.$refs, db.models, {
          attachments: Model ? dbHook.buildAttachments(Model, __dirname, 'tmp') : [],
          payload: req.body.payload,
          where: req.body.where,
          keys: req.params.keys,
        }, Model.name) : undefined,
        action: req.params.action,
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
              `<html><head><link rel="stylesheet" href="/jsonschema-form-mw/styles.css"/></head>`,
              `<body><script type="application/json" data-component="jsonschema-form">${JSON.stringify(data)}</script>`,
              `<script src="/jsonschema-form-mw/main.js"></script></body></html>`,
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

    const port = process.env.PORT || 8081;

    app.listen(port, () => {
      console.log(`Listening at http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
