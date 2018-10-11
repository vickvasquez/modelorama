module.exports = ({ gateway }) => ({
  product() {
    return gateway.Product.product();
  },
  products() {
    return gateway.Product.products().then(x => x.data);
  },
});
