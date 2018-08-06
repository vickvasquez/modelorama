'use strict';

const ModelsResolver = require('../resolve/models');

class Container {
  constructor() {
    this.models = new ModelsResolver(this, {
      directory: `${__dirname}/models`,
      settings: require('../../config'),
    });
  }

  connect() {
    return this.models.connect();
  }

  getModel(name) {
    return this.models.get(name);
  }
}

module.exports = new Container();
