// const roles = require('./roles');
// const errorHelper = require('../helpers/error');

// class Authorization {
//   validate(method, context) {
//     if (roles[method].indexOf(context.user.role) > -1) {
//       return Promise.resolve();
//     }

//     const error = {
//       path: 'user',
//       message: 'Unauthorized role'
//     };

//     return errorHelper.handleResponse('Session', error, context.guid);
//   }
// }

// module.exports = new Authorization();


module.exports = function auth(req, args) {
  console.log('CHECK', 'auth', args, req.body);
};
