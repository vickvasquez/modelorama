'use strict';

const TIMEOUT = process.env.GRPC_TIMEOUT || 10;

const inspect = require('util').inspect;
const path = require('path');

const _ = require('lodash');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const protoOptions = {
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  keepCase: false,
};

const Resolver = require('sastre').Resolver;

class GRPCResolver {
  constructor(container, options) {
    this.repository = new Resolver(container, options.directory);

    let _pkg;
    let _server;
    let _gateway;

    Object.defineProperty(this, '_pkg', {
      enumerable: false,
      get: () => {
        if (!_pkg) {
          _pkg = protoLoader.loadSync(options.filename, protoOptions);
          _pkg = grpc.loadPackageDefinition(_pkg).schema;
        }

        return _pkg;
      },
    });

    Object.defineProperty(this, '_server', {
      enumerable: false,
      get: () => {
        if (!_server) {
          _server = new grpc.Server();

          GRPCResolver.registerHandlers(this._pkg, this.repository, _server);
        }

        return _server;
      }
    });

    Object.defineProperty(this, '_gateway', {
      enumerable: false,
      get: () => {
        if (!_gateway) {
          _gateway = {};

          const credentials = grpc.credentials.createInsecure();

          Object.keys(this._pkg).forEach(service => {
            _gateway[service] = GRPCResolver.bindHandlers(this._pkg[service],
              '0.0.0.0:50051' || `${service}:80`,
              credentials);
          });
        }

        return _gateway;
      },
    });
  }

  static registerHandlers(pkg, repo, server) {
    Object.keys(repo.registry).forEach(ctrlName => {
      if (!pkg[ctrlName]) {
        throw new Error(`Unknown '${ctrlName}' service in ${index}`);
      }

      const protoService = pkg[ctrlName].service;
      const implementation = {};

      Object.keys(protoService).forEach(method => {
        implementation[method] = function call(ctx, callback) {
          const request = ctx.request;
          const controllerInstance = repo.get(ctrlName);

          let response;

          return Promise.resolve()
            .then(() => controllerInstance[method](request))
            .then(_response => {
              response = _response;

              callback(null, response);
            })
            .catch(err => {
              console.warn(err.stack); // eslint-ignore
            });
        };
      });

      server.addService(protoService, implementation);
    });
  }

  static bindHandlers(Proto, protoAddr, credentials) {
    const protoInstance = new Proto(protoAddr, credentials);
    const implementation = {};

    Object.keys(Proto.service).forEach(method => {
      implementation[method] = function call(data) {
        return GRPCResolver.callHandler(protoInstance, method, data);
      };
    });

    return implementation;
  }

  static callHandler(service, method, data) {
    const deadline = new Date();

    deadline.setSeconds(deadline.getSeconds() + TIMEOUT);

    return new Promise((resolve, reject) => {
      service[method](data, { deadline }, (error, response) => {
        if (error) {
          if (error.details.charAt() === '{' && error.details.charAt(error.details.length - 1) === '}') {
            reject(JSON.parse(error.details));
          } else {
            reject(error);
          }
        } else {
          resolve(response);
        }
      });
    });
  }

  getGateway(name) {
    return this._gateway[name];
  }

  connect() {
    this._server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
    this._server.start();

    return this;
  }

  get(name) {
    return this.repository.get(name);
  }
}

module.exports = GRPCResolver;
