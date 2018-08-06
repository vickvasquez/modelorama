'use strict';

const GRPCResolver = require('../helpers/grpc');
const ModelsResolver = require('../helpers/models');

class Container {
  constructor() {
    this.controllers = new GRPCResolver(this, {
      directory: `${__dirname}/controllers`,
      filename: `${__dirname}/generated/index.proto`,
    });

    this.models = new ModelsResolver(this, {
      directory: `${__dirname}/models`,
      settings: require('../../config'),
    });
  }

  connect() {
    return Promise.all([
      this.models.connect(),
      this.controllers.connect(),
    ]);
  }

  getController(name) {
    return this.controllers.get(name);
  }

  getGateway(name) {
    return this.controllers.getGateway(name);
  }

  getModel(name) {
    return this.models.get(name);
  }
}

module.exports = new Container();
