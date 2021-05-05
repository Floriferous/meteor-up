"use strict";

var _utils = require("../utils");

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('validator utils', () => {
  describe('serversExist', () => {
    it('should find nonexistent servers', () => {
      const serversConfig = {
        one: {},
        two: {}
      };
      const usedServers = {
        one: {},
        three: {}
      };
      const result = (0, _utils.serversExist)(serversConfig, usedServers);
      const expectedLength = 1;
      (0, _assert.default)(result.length === expectedLength);
    });
  });
  describe('addDepreciation', () => {
    it('should add a depreciation detail', () => {
      const details = [];
      const path = 'servers.test';
      const reason = 'Use "testing" instead';
      const link = 'http://google.com';
      const [result] = (0, _utils.addDepreciation)(details, path, reason, link);
      (0, _assert.default)(result.type === 'depreciation');
      (0, _assert.default)(result.path === path);
      (0, _assert.default)(result.message.indexOf(reason) > -1);
      (0, _assert.default)(result.message.indexOf(link) > -1);
    });
  });
  describe('addLocation', () => {
    it('should add location to message', () => {
      const expected = '"app.a.b.c" message';
      const details = [{
        path: ['a', 'b', 'c'],
        message: 'message'
      }];
      const location = 'app';
      const [{
        message
      }] = (0, _utils.addLocation)(details, location);
      (0, _assert.default)(message === expected, message);
    });
    it('should support paths from joi v10', () => {
      const expected = '"app.a.b.c" message';
      const details = [{
        path: 'a.b.c',
        message: 'message'
      }];
      const location = 'app';
      const [{
        message
      }] = (0, _utils.addLocation)(details, location);
      (0, _assert.default)(message === expected, message);
    });
  });
});
//# sourceMappingURL=utils.unit.js.map