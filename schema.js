const glob = require('glob');
const path = require('path');

const test = require('json-schema-to/test/utils');
const JST = require('json-schema-to');
const jsf = require('json-schema-faker');

const refs = [
  {
    id: 'dataTypes',
    ...require('./src/schema/types/dataTypes.json'),
  },
];

function int(min = 1, max = 100) {
  return Math.round(Math.random() * max) + min;
}

const schemas = glob
  .sync('**/schema.json', { cwd: `${__dirname}/src/schema/models` })
  .map(schemaFile => {
    const schemaDefinition = require(`${__dirname}/src/schema/models/${schemaFile}`);

    if (!schemaDefinition.id) {
      const modelId = schemaFile.replace(/\/(?:schema\.json)?/g, '');

      schemaDefinition.id = modelId;
    }

    refs.push(schemaDefinition);

    return schemaDefinition;
  });

let serverInstance;

Promise.resolve()
  .then(() => Promise.all(schemas.map(schema => {
    return schema.serviceDefinition && new JST(schema).scan(__dirname, refs);
  })))
  .then(async results => {
    // return;
    const _jst = JST.merge('osom', results);

    const {
      Cart, CartList, Product, ProductList,
    } = _jst.$refs;

    const storeMock = {
      Cart() {
        return jsf(Cart, refs);
      },
      Carts() {
        return jsf(CartList, refs)
      },
      Products() {
        return jsf(ProductList, refs)
      },
      Product() {
        return jsf(Product, refs)
      },
    };

    console.log('# Protobuf');

    const _protobuf = _jst.protobuf;

    test.mockFs({
      'generated.proto': Buffer.from(`${_protobuf}\nmessage Empty {}`),
    });

    serverInstance = new test.Server();

    async function call(client, modelId, method, payload) {
      return new Promise(done => {
        const payload = {};
        const deadline = new Date();

        deadline.setSeconds(deadline.getSeconds() + 3);

        client[method](payload, { deadline }, async (error, response) => {
          const validate = test.is({ $ref: modelId }, {
            schemas: refs.reduce((prev, cur) => {
              prev[cur.id] = cur;
              return prev;
            }, {}),
          });

          await validate(response);

          console.log(error || 'OK');
          console.log('>>> GRPC', validate.errors || 'OK');

          if (validate.errors) {
            console.log(JSON.stringify(response, null, 2));
          }

          done(response);
        });
      })
    }

    try {
      const protoOptions = {};
      const packageDefinition = test.loadSync('generated.proto', protoOptions);
      const packageObject = test.loadPackageDefinition(packageDefinition);
      const Handler = packageObject.osom.Osom;
      const gateway = new Handler('0.0.0.0:50051', test.credentials.createInsecure());

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

      serverInstance.bind('0.0.0.0:50051', test.ServerCredentials.createInsecure());
      serverInstance.start();
      serverInstance.invoke = (...args) => call(gateway, ...args);

      async function until(cb) {
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

      await until(() => serverInstance.started);
    } catch (e) {
      console.log(_protobuf);
      console.log(e);
    }

    console.log('# GraphQL');

    const _schema = _jst.schema;
    const _schemaUsed = schemas.find(x => x.id === 'Cart');

    try {
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

      const response = await test.graphql(gql, query, {
        ...storeMock,
        async Cart() {
          return serverInstance.invoke('Cart', 'cart', {});
        },
      });

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
        schemas: refs.reduce((prev, cur) => {
          prev[cur.id] = cur;
          return prev;
        }, {}),
      });

      await validate(response);

      console.log('>>> GRAPHQL', validate.errors || 'OK');
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log(_schema);
      console.log(e.message);
      console.log(e.locations);
    }
  })
  .catch(e => {
    console.log(e);
  })
  .then(() => {
    return new Promise(done => {
      serverInstance.tryShutdown(done);
    });
  });
