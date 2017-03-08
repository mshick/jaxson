module.exports = {
  propertyMap: [
    [
      null,
      {
        key: 'name',
        transformValue: function({source}) {
          return `${source.firstName} ${source.lastName}`;
        }
      }
    ]
  ]
};
