module.exports = {
  dialect: 'sqlite',
  storage: `${__dirname}/db/data.sqlite`,
  directory: `${__dirname}/db`,
  define: {
    underscored: true,
    freezeTableName: true,
  },
};
