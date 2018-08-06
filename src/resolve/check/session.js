const gateway = require('../grpc').getGateway();

const passport = require('passport');
const bearer = require('passport-http-bearer');

passport.use(new bearer.Strategy((token, done) => {
  const request = {
    params: {
      token,
    },
  };

  return Promise.resolve()
    .then(() => gateway.call('Session', 'checkToken', request))
    .then(session => {
      done(null, session);
    })
    .catch(done);
}));

function authenticate(req) {
  return new Promise((resolve, reject) => {
    passport.authenticate('bearer', { session: false }, err => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    })(req);
  });
}

module.exports = function session(req) {
  const authorization = req.get('authorization') || '';
  const token = authorization.split(' ').pop() || undefined;

  req.token = token;

  return authenticate(req);
};
