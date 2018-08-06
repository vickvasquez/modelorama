// /* eslint-disable no-unused-expressions */
// const expect = require('chai').expect;
// const td = require('testdouble');

// /* global beforeEach, describe, it */

// describe('RequestHandler', () => {
//   const RequestHandler = require('.');

//   describe('call', () => {
//     const {
//       request, controller, method, error, guid,
//     } = require('./fixtures');

//     let logger;
//     let errorHandler;
//     let respondsCallback;

//     beforeEach(() => {
//       logger = {
//         message: td.func(),
//         exception: td.func(),
//       };

//       errorHandler = {
//         responds: td.func(),
//       };

//       respondsCallback = td.func();

//       td.replace(controller, 'method', td.func());
//     });

//     it('should reject if controller.method() fails', async () => {
//       td.when(controller.method(request)).thenReject(error);
//       td.when(errorHandler.responds(error, guid, respondsCallback)).thenThrow(error);

//       try {
//         const handler = new RequestHandler(logger, errorHandler);

//         await handler.call({ request }, respondsCallback, controller, 'Test', method);
//       } catch (e) {
//         expect(e).to.eql(error);
//       }

//       expect(td.explain(errorHandler.responds).callCount).to.eql(1);
//       expect(td.explain(logger.message).callCount).to.eql(1);
//       expect(td.explain(respondsCallback).callCount).to.eql(0);
//     });

//     it('should resolve if there was no issue otherwise', async () => {
//       const IF_OK = Symbol('ON_SUCCESS');

//       td.when(controller.method(request)).thenResolve(IF_OK);
//       td.when(respondsCallback(null, IF_OK)).thenReturn();

//       const handler = new RequestHandler(logger, errorHandler);

//       await handler.call({ request }, respondsCallback, controller, 'Test', method);

//       expect(td.explain(logger.message).callCount).to.eql(2);
//       expect(td.explain(respondsCallback).callCount).to.eql(1);
//       expect(td.explain(errorHandler.responds).callCount).to.eql(0);
//     });
//   });
// });
