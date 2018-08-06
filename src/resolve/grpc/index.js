'use strict';

const path = require('path');

const _ = require('lodash');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const Gateway = require('./gateway');
// const errorHandler = require('../error');

const protosPath = path.resolve(__dirname, '../../schema/generated');

const protoOptions = {
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  keepCase: false,
};

class GRPC {
  static registerHandlers(server, controllers) {
    const repo = controllers.repository;
    const log = require('../logger').createLogger(__filename);

    const packageDefinition = protoLoader.loadSync(`${protosPath}/index.proto`, protoOptions);
    const packageObject = grpc.loadPackageDefinition(packageDefinition).schema;

    Object.keys(repo.registry).forEach(ctrlName => {
      const protoService = packageObject[ctrlName].service;
      const implementation = {};

      Object.keys(protoService).forEach(method => {
        implementation[method] = function call(ctx, callback) {
          const request = ctx.request;
          const controllerInstance = repo.get(ctrlName);

          log.message(`${ctrlName}.${method}`, { request }, request.guid);

          let response;

          return Promise.resolve()
            .then(() => controllerInstance[method](request))
            .then(_response => {
              response = _response;

              log.message(`${ctrlName}.${method}`, { response }, request.guid);

              callback(null, response);
            })
            .catch(err => {
              log.exception(err, `${ctrlName}.${method}`, { response }, request.guid);
              // errorHandler.responds(err, request.guid, callback);
              console.warn(err.stack); // eslint-ignore
            });
        };
      });

      server.addService(protoService, implementation);
    });
  }

  static getGateway() {
    if (!GRPC._gateway) {
      GRPC._gateway = new Gateway(protoOptions);
    }

    return GRPC._gateway;
  }

  static createServer() {
    const serverInstance = new grpc.Server();

    serverInstance.use = (port, controllers) => {
      GRPC.registerHandlers(serverInstance, controllers);

      serverInstance.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
      serverInstance.start();
    };

    return serverInstance;
  }
}

module.exports = GRPC;
