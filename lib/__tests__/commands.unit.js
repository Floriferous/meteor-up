"use strict";

var _commands = _interopRequireWildcard(require("../commands"));

var _assert = _interopRequireDefault(require("assert"));

var _sinon = _interopRequireDefault(require("sinon"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

describe('commands', () => {
  beforeEach(() => {
    for (const prop of Object.keys(_commands.commands)) {
      delete _commands.commands[prop];
    }
  });
  describe('registerCommad', () => {
    it('should add command to list of commands', () => {
      function handler() {}

      (0, _commands.default)('docker', 'setup', handler);
      (0, _assert.default)(_commands.commands['docker.setup'] === handler);
    });
  });
  describe('registerCommandOverrides', () => {
    let spy;
    beforeEach(() => {
      spy = _sinon.default.spy(console, 'log');
    });
    afterEach(() => {
      spy.restore();
    });
    it('should add override to list of commands', () => {
      function target() {}

      _commands.commands['plugin.docker-setup'] = target;
      (0, _commands.registerCommandOverrides)('plugin', {
        'docker.setup': 'plugin.docker-setup'
      });
      (0, _assert.default)(_commands.commands['docker.setup'] === target);
    });
    it('should support shorter override format', () => {
      function target() {}

      _commands.commands['plugin.docker-setup'] = target;
      (0, _commands.registerCommandOverrides)('plugin', {
        'docker.setup': 'docker-setup'
      });
      (0, _assert.default)(_commands.commands['docker.setup'] === target);
    });
    it('should warn when override handler doesn\'t exist', () => {
      (0, _commands.registerCommandOverrides)('plugin', {
        'docker.setup': 'docker-setup'
      });
      (0, _assert.default)(spy.called);
    });
  });
});
//# sourceMappingURL=commands.unit.js.map