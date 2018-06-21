'use strict';

const validator = require('is-my-json-valid');
const jsf = require('json-schema-faker');
const _ = require('lodash');
const db = require('./models');

const refs = {};
const schemas = {};

const defaults = {
  random: Math.random,
  useDefaultValue: false,
  alwaysFakeOptionals: false,
};

function _assertFrom(schema, data) {
  const validate = validator(schema, {
    schemas: refs,
    verbose: true,
    greedy: true,
  });

  if (!validate(data)) {
    const err = new Error(schema.id
      ? `Invalid input for ${schema.id}`
      : 'Invalid input for given schema');

    err.sample = data;
    err.schema = schema;
    err.errors = validate.errors.map(e => {
      e.field = e.field !== 'data'
        ? e.field.substr(5)
        : e.field;

      return e;
    });

    throw err;
  }
}

function _validateFrom(schema, data) {
  return new Promise((resolve, reject) => {
    try {
      _assertFrom(schema, data);
      resolve(data);
    } catch (e) {
      reject(e);
    }
  });
}

function _fakeAll(schema, opts) {
  jsf.option(_.merge(opts, defaults));

  return jsf({
    type: 'array',
    items: schema,
    minItems: 1,
  }, refs);
}

function _fake(schema, opts) {
  jsf.option(_.merge(opts, defaults));

  return jsf(schema, refs);
}

Object.keys(db.$refs).forEach(refId => {
  refs[refId] = db.$refs[refId].$schema;

  schemas[refId] = {
    fake: opts => _fake(refs[refId], opts),
    fakeAll: opts => _fakeAll(refs[refId], opts),
    assert: data => _assertFrom(refs[refId], data),
    validate: data => _validateFrom(refs[refId], data),
  };
});

module.exports = schemas;
