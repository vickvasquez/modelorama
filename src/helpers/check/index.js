'use strict';

const Chainable = require('sastre').Chainable;

const input = require('./input');
const session = require('./session');
const authorization = require('./auth');

class MiddlewareProxy {
  constructor(container, middleware) {
    return new Chainable(container, Object.assign({
      auth(req, args) {
        return Promise.resolve()
          .then(() => session(req, args))
          .then(() => authorization(req, args));
      },
      input,
      session,
    }, middleware));
  }
}

module.exports = {
  MiddlewareProxy,
};
