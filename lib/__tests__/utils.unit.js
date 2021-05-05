"use strict";

var utils = _interopRequireWildcard(require("../utils"));

var _assert = _interopRequireDefault(require("assert"));

var _chai = require("chai");

var _nodemiral = _interopRequireDefault(require("@zodern/nodemiral"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

describe('utils', () => {
  describe('addStdioHandlers', () => {
    it('should add stdio handlers to nodemiral task list', () => {
      const list = _nodemiral.default.taskList('Test');

      list.executeScript('testing', {}); // Test that it doesn't throw an error

      utils.addStdioHandlers(list);
    });
  });
  describe('runTaskList', () => {
    it('should resolve when list is sucessfull', cb => {
      const list = {
        run(sessions, opts, runCb) {
          runCb({});
        }

      };
      utils.runTaskList(list, {}, {}).then(() => {
        cb();
      });
    });
    it('should add stdio handlers for verbose', cb => {
      const list = {
        _taskQueue: [],

        run(sessions, opts, runCb) {
          (0, _chai.expect)(opts.verbose).to.equal(undefined);
          runCb({});
        }

      };
      utils.runTaskList(list, {}, {
        verbose: true
      }).then(() => {
        cb();
      });
    });
    it('should reject if a task failed', cb => {
      const list = {
        run(sessions, opts, runCb) {
          runCb({
            copy: {
              error: 'error'
            }
          });
        }

      };
      utils.runTaskList(list, {}, {}).catch(() => {
        cb();
      });
    });
  });
  describe('countOccurences', () => {
    it('should return the correct count', () => {
      const needle = 'Meteor';
      const haystack = 'Production Quality Meteor Deployments. Meteor Up is a command line tool that allows you to deploy any Meteor app to your own server.';
      const count = utils.countOccurences(needle, haystack);
      (0, _assert.default)(count === 3);
    });
  });
  describe('resolvePath', () => {
    it('should return the correct path', () => {
      const result = utils.resolvePath('/root', '../opt');

      const expected = _path.default.resolve('/root', '../opt');

      (0, _assert.default)(result === expected);
    });
    it('should expand tilde', () => {
      const result = utils.resolvePath('~/.ssh');
      (0, _assert.default)(result.indexOf('~') === -1);
    });
  });
  describe('createOption', () => {
    it('should handle long options', () => {
      const result = utils.createOption('option');
      (0, _assert.default)(result === '--option');
    });
    it('should handle short options', () => {
      const result = utils.createOption('o');
      (0, _assert.default)(result === '-o');
    });
  });
  describe('argvContains', () => {
    it('should find exact matches', () => {
      const result = utils.argvContains(['a', 'b'], 'a');
      (0, _assert.default)(result);
    });
    it('should find matches that contain the value', () => {
      const result = utils.argvContains(['a', 'b=c'], 'b');
      (0, _assert.default)(result);
    });
    it('should return false if not found', () => {
      const result = utils.argvContains(['a', 'b'], 'c');
      (0, _assert.default)(!result);
    });
  });
  describe('filterArgv', () => {
    it('should remove unwanted options', () => {
      const argv = {
        _: ['logs'],
        config: './mup.js',
        tail: true
      };
      const argvArray = ['mup', 'logs', '--config=./mup.js', '--tail'];
      const unwanted = ['_', 'config'];
      const result = utils.filterArgv(argvArray, argv, unwanted);
      (0, _chai.expect)(result).to.deep.equal(['logs', '--tail']);
    });
    it('should remove undefined and false options', () => {
      const argv = {
        _: ['logs'],
        config: undefined,
        verbose: true,
        follow: false
      };
      const argvArray = ['mup', 'logs', '--verbose'];
      const unwanted = ['_'];
      const result = utils.filterArgv(argvArray, argv, unwanted);
      (0, _chai.expect)(result).to.deep.equal(['logs', '--verbose']);
    });
    it('should add non-boolean values', () => {
      const argv = {
        _: ['logs'],
        tail: '10',
        follow: true
      };
      const argvArray = ['mup', 'logs', '--tail=10', '--follow'];
      const unwanted = ['_'];
      const result = utils.filterArgv(argvArray, argv, unwanted);
      (0, _chai.expect)(result).to.deep.equal(['logs', '--tail', '10', '--follow']);
    });
    it('should remove options not provided by user', () => {
      const argv = {
        _: ['logs'],
        follow: true,
        tail: '10'
      };
      const argvArray = ['mup', 'logs'];
      const unwanted = ['_'];
      const result = utils.filterArgv(argvArray, argv, unwanted);
      (0, _chai.expect)(result).to.deep.equal(['logs']);
    });
  });
});
//# sourceMappingURL=utils.unit.js.map