'use strict';

const assert = require('assert');

const models = require('./src/models');
const $schema = require('./src/models/schema');

const exampleProduct = $schema.Product.fake();

Promise.resolve()
  .then(() => models.connect())
  .then(() => models.sync({ force: true }))
  .then(() => Promise.all([
    models.Cart.create(),
    models.Product.create(exampleProduct),
  ]))
  .then(cartAndProduct => {
    const cart = cartAndProduct[0];
    const product = cartAndProduct[1];

    return cart.addItem(product, { through: { qty: 3 } })
      .then(() => cart.getItems())
      .then(results => {
        assert(results.length === 1);
        assert(results[0].code === exampleProduct.code);
        assert(results[0].name === exampleProduct.name);
        assert(results[0].price === exampleProduct.price);
        assert(results[0].CartItem.qty === 3);
      })
      .then(() => cart.removeItem(product))
      .then(() => cart.countItems())
      .then(result => {
        assert(result === 0);
      });
  })
  .catch(e => {
    console.error(e);
  });