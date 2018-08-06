class ControllerExample {
  method() {
    return this;
  }
}

const guid = '8c7319b7-38d6-42f3-8502-2813b2c03137';
const error = new Error('Unexpected failure');

const method = 'method';
const controller = new ControllerExample();

const request = {
  guid,
};

module.exports = {
  controller,
  request,
  method,
  error,
  guid,
};
