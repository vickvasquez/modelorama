const assert = require('assert');
const schema = require('./src/schema');

async function main() {
  const { sync } = schema.models.database;

  await schema.connect();

  const Cart = schema.getModel('Cart');
  const Product = schema.getModel('Product');

  const exampleProduct = Product.fakeOne();

  try {
    await sync({ force: true });

    let x = 4;

    while (x > 0) {
      await Product.create(Product.fakeOne()); // eslint-disable-line
      x -= 1;
    }

    const cart = await Cart.create();
    const product = await Product.create(exampleProduct);

    await cart.addItem(product, { through: { qty: 3 } });

    const results = await cart.getItems();

    assert(results.length === 1);
    assert(results[0].code === exampleProduct.code);
    assert(results[0].name === exampleProduct.name);
    assert(results[0].price == exampleProduct.price)
    assert(results[0].CartItem.qty == 3);

    await cart.removeItem(product);

    const result = await cart.countItems();

    assert(result === 0);
  } finally {
    schema.close();
  }
}

main();
