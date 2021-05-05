"use strict";

var _hooks = require("../hooks");

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('hooks', () => {
  beforeEach(() => {
    for (const prop of Object.keys(_hooks.hooks)) {
      delete _hooks.hooks[prop];
    }
  });
  it('should create new hooks', () => {
    const target = {
      localScript: 'test'
    };
    (0, _hooks.registerHook)('pre.default.setup', target);
    (0, _assert.default)(_hooks.hooks['pre.default.setup'].length === 1);
    (0, _assert.default)(_hooks.hooks['pre.default.setup'][0] === target);
  });
  it('should add hooks when some already exist', () => {
    const target = {
      localScript: 'test'
    };
    (0, _hooks.registerHook)('pre.default.setup', target);
    (0, _hooks.registerHook)('pre.default.setup', target);
    (0, _assert.default)(_hooks.hooks['pre.default.setup'].length === 2);
    (0, _assert.default)(_hooks.hooks['pre.default.setup'][1] === target);
  });
  it('should add missing plugin name to hooks for default commands', () => {
    const target = {
      localScript: 'test'
    };
    (0, _hooks.registerHook)('pre.setup', target);
    (0, _assert.default)(_hooks.hooks['pre.default.setup'][0] === target);
  });
  it('should move functions to the method property', () => {
    const target = function () {};

    (0, _hooks.registerHook)('pre.setup', target);
    (0, _assert.default)(_hooks.hooks['pre.default.setup'][0].method === target);
  });
});
//# sourceMappingURL=hooks.unit.js.map