module.exports = {
  dialect: 'sqlite',
  storage: ':memory:',
  directory: `${__dirname}/db`,
  define: {
    underscored: true,
    freezeTableName: true,
  },
};
