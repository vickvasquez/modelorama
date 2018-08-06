module.exports = ctx => ({
  Products() {
    return ctx.Product.findAll()
      .then(result => ({
        data: result,
      }));
  },
});
