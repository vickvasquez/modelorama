'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

const db = require('./src/models');
const app = require('express')();

function _buildAttachments(Model, baseDir, uploadDir) {
  const _attachments = [];

  if (Model.options.$schema.properties) {
    Object.keys(Model.options.$schema.properties).forEach(key => {
      const x = Model.options.$schema.properties[key].attachment;

      if (x) {
        const dest = uploadDir || 'uploads';

        _attachments.push({
          key,
          dest,
          baseDir,
        });
      }
    });
  }

  return _attachments;
}

db.connect()
  .then(() => {
    const modelsNames = Object.keys(db.models);

    app.get('/', (req, res) => {
      res.json({
        status: 'ok',
        response: {
          models: modelsNames,
        },
      });
    });

    app.get('/db/:model/:action?/:id?', (req, res) => {
      const bodyParams = req.body || {};
      const modelName = req.params.model;
      const Model = db.models[modelName];

      const config = {
        attachments: _buildAttachments(Model, __dirname),
        payload: bodyParams.payload,
        where: bodyParams.where,
      };

      if (Model.primaryKeyAttribute) {
        config[Model.primaryKeyAttribute] = req.params.id || null;
      }

      const resource = JSONSchemaSequelizer.resource(db.$refs, Model, config);
      const action = req.params.action || 'index';

      resource.options.isNew = action === 'new';
      resource.options.action = action;
      resource.options.actions = {};
      resource.options.actions[Model.name] = {
        index: {
          verb: 'GET',
          path: '/',
        },
      };

      ['new', 'create', 'edit', 'show', 'update', 'destroy'].forEach(method => {
        resource.options.actions[Model.name][method] = {
          verb: 'GET',
          path: '/',
        };
      });

      if (!/application\/.*json/.test(req.headers.accept)) {
        const prefixURL = '//rawgit.com/pateketrueke/0a6693268093ceecd973aae49e55939e/raw/2d9d98b29a2e7569e1744be09c31d95c37b3f44b';

        res.send(`
          <html>
            <head>
              <link rel="stylesheet" href="${prefixURL}/application.css"/>
            </head>
            <body>
              <script type="application/json" data-component="jsonschema-form">${JSON.stringify(resource.options)}</script>
              <script src="${prefixURL}/application.js"></script>
            </body>
          </html>
        `);
        return;
      }

      switch (action) {
        case 'new':
          res.json(resource.options);
          break;

        case 'index':
          resource.actions.findAll()
            .then(result => {
              res.json(result);
            });
          break;

        case 'edit':
        case 'show':
          resource.actions.findOne()
            .then(result => {
              res.json(result);
            });
          break;

        default:
          res.json({
            status: 'err',
            response: 'Not found',
          });
          break;
      }
    });

    app.listen(3001, () => {
      console.log('Listening at http://localhost:3001');
    });
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
