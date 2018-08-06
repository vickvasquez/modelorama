'use strict';

const TIMEOUT = process.env.GRPC_TIMEOUT || 10;

const path = require('path');

const inspect = require('util').inspect;

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const protosPath = path.resolve(__dirname, '../../schema/generated');

class Gateway {
  constructor(protoOptions) {
    this.repository = {};

    const credentials = grpc.credentials.createInsecure();
    const services = {};

    const packageDefinition = protoLoader.loadSync(`${protosPath}/index.proto`, protoOptions);
    const packageObject = grpc.loadPackageDefinition(packageDefinition).schema;

    Object.keys(packageObject).forEach(service => {
      const protoAddr = services[service] || '0.0.0.0:50051' || `${service}:80`;
      const ProtoService = packageObject[service];

      this.repository[service] = new ProtoService(protoAddr, credentials);
    });
  }

  call(service, method, data) {
    if (!(service && this.repository[service])) {
      throw new Error(`Invalid service, given ${inspect(service)}`);
    }

    if (!this.repository[service][method]) {
      throw new Error(`Unknown method on ${service}, given ${inspect(method)}`);
    }

    const deadline = new Date();

    deadline.setSeconds(deadline.getSeconds() + TIMEOUT);

    return new Promise((resolve, reject) => {
      this.repository[service][method](data, { deadline }, (error, response) => {
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
}

module.exports = Gateway;
