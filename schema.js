'use strict';

const debug = require('debug')('schema.js');

if (process.argv.slice(2).indexOf('--debug') !== -1) {
  require('debug').enable('schema.js');
}

const glob = require('glob');
const path = require('path');

const Service = require('json-schema-to').Service;

const schemas = require('./src/schema/models').schemas;

let serverInstance;

const test = require('json-schema-to/test/utils');
const jsf = require('json-schema-faker');

Promise.resolve()
  .then(() => Service.load(schemas))
  .then(_bundle => {
    const _jst = Service.merge('osom', _bundle);

    const Cart = _jst.$refs.Cart;
    const CartList = _jst.$refs.CartList;
    const Product = _jst.$refs.Product;
    const ProductList = _jst.$refs.ProductList;

    const storeMock = {
      Cart() {
        return jsf(Cart, schemas);
      },
      Carts() {
        return jsf(CartList, schemas)
      },
      Products() {
        return jsf(ProductList, schemas)
      },
      Product() {
        return jsf(Product, schemas)
      },
    };

    console.log('# Protobuf setup');

    const _protobuf = _jst.protobuf;

    test.mockFs({
      'generated.proto': Buffer.from(`${_protobuf}\nmessage Empty {}`),
    });

    debug('starting server');

    serverInstance = new test.Server();

    function call(client, modelId, method, payload) {
      return new Promise(done => {
        const payload = {};
        const deadline = new Date();

        deadline.setSeconds(deadline.getSeconds() + 3);

        debug('make request');

        client[method](payload, { deadline }, (error, response) => {
          debug('validate response');

          const validate = test.is({ $ref: modelId }, {
            schemas: schemas.reduce((prev, cur) => {
              prev[cur.id] = cur;
              return prev;
            }, {}),
          });

          return Promise.resolve()
            .then(() => validate(response))
            .then(() => {
              console.log(error || 'OK');
              console.log('>>> GRPC', validate.errors || 'OK');

              if (validate.errors) {
                console.log(JSON.stringify(response, null, 2));
              }

              done(response);
            });
        });
      })
    }

    function until(cb) {
      return new Promise(ok => {
        setTimeout(() => {
          if (cb()) {
            ok();
          } else {
            until(cb).then(ok);
          }
        }, 100);
      });
    }

    try {
      debug('setup gateway');

      const protoOptions = {};
      const packageDefinition = test.loadSync('generated.proto', protoOptions);
      const packageObject = test.loadPackageDefinition(packageDefinition);
      const Handler = packageObject.osom.Osom;
      const gateway = new Handler('0.0.0.0:50051', test.credentials.createInsecure());

      debug('services registration');

      serverInstance.addService(Handler.service, {
        cart(ctx, reply) {
          reply(null, storeMock.Cart());
        },
        carts(ctx, reply) {
          reply(null, storeMock.Carts());
        },
        product(ctx, reply) {
          reply(null, storeMock.Product());
        },
        products(ctx, reply) {
          reply(null, storeMock.Products());
        },
      });

      debug('starting server');

      serverInstance.bind('0.0.0.0:50051', test.ServerCredentials.createInsecure());
      serverInstance.start();
      serverInstance.invoke = (service, method, data) => call(gateway, service, method, data);
    } catch (e) {
      console.log(_protobuf);
      console.log(e);
    }

    return until(() => serverInstance.started)
      .then(() => {
        console.log('# GraphQL setup');

        const _schema = _jst.graphql;
        const _schemaUsed = schemas.find(x => x.id === 'Cart');

        try {
          debug('build schema');

          const gql = test.makeExecutableSchema({
            typeDefs: [_schema, test.trim(`
              type Query {
                status: Boolean
              }
              type Mutation {
                status: Boolean
              }
              schema {
                query: Query
                mutation: Mutation
              }
            `)],
          });

          const query = `
            query {
              Cart {
                id
                items {
                  qty
                  Product {
                    id
                    name
                    price
                  }
                }
              }
            }
          `;

          debug('make request');

          return test.graphql(gql, query, Object.assign({}, storeMock, {
            Cart() {
              return serverInstance.invoke('Cart', 'cart', {});
            },
          })).then(response => {
            debug('validate response');

            const fixedSchema = {
              type: 'object',
              properties: {
                data: {
                  Cart: {
                    $ref: 'Cart',
                  },
                },
              },
            };

            const validate = test.is(fixedSchema, {
              schemas: schemas.reduce((prev, cur) => {
                prev[cur.id] = cur;
                return prev;
              }, {}),
            });

            return Promise.resolve()
              .then(() => validate(response))
              .then(() => {
                console.log('>>> GRAPHQL', validate.errors || 'OK');
                console.log(JSON.stringify(response, null, 2));
              });
          });
        } catch (e) {
          console.log(_schema);
          console.log(e.message);
          console.log(e.locations);
        }
      });
  })
  .catch(e => {
    console.log(e.stack);
  })
  .then(() => {
    return new Promise(done => {
      serverInstance.tryShutdown(done);
    });
  });
