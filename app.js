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
        req.params.action = req.method === 'GET'
          ? (req.params.action || 'index')
          : 'create';
      }

      if (req.params.action === 'show' && req.method === 'POST') {
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
          const _pks = db.models[modelName].primaryKeys;
          const _path = Object.keys(_pks).sort().map(k => `:${k}`).join('/');

          return !action
            ? `/db/${modelName}`
            : `/db/${modelName}/${action === 'new'
            ? action
            : `${_path}/${action === 'edit' ? action : ''}`.replace(/\/$/, '')
          }`;
        },
        resource: Model ? JSONSchemaSequelizer.resource(db.$refs, db.models, {
          attachments: Model ? dbHook.buildAttachments(Model, __dirname, 'tmp') : [],
          payload: req.body.payload || req.query.payload,
          where: req.body.where || req.query.where,
          keys: req.params.keys,
          raw: true,
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
              `<body><script type="application/json" data-component="jsonschema-form">${JSON.stringify(data, null, 2)}</script>`,
              `<script src="/jsonschema-form-mw/main.js"></script></body></html>`,
            ].join(''));
            return;
          }

          res.json(data);
        })
        .catch(e => {
          if (isJSON) {
            res.json({
              result: e.stack || e,
            });
            return;
          }

          res.send(e.stack || e);
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
