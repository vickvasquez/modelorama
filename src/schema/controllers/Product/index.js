module.exports = ({ Product }) => ({
  product() {
    return Product.findOne()
      .then(result => result.get());
  },
  products() {
    return Product.findAll()
      .then(result => ({
        data: result.map(x => x.get()),
      }));
  },
});
