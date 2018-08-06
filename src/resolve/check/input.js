'use strict';

const validator = require('is-my-json-valid');

function createValidator(schema) {
  return value => {
    const validation = validator(schema);

    return Promise.resolve()
      .then(() => validation(value))
      .then(() => {
        if (validation.errors) {
          console.log('>>>', validation.errors);
        }
      });
  };
}

let cached;

module.exports = function input(req, args) {
  if (!cached) {
    cached = createValidator({
      type: 'object',
    });
  }

  return cached(args);
};
