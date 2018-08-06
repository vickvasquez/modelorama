module.exports = ctx => ({
  Products() {
    return ctx.product.Products()
      .then(x => x.data);
  },
});
