"use strict";

var validate = _interopRequireWildcard(require("../validate"));

var _commands = require("../commands");

var _chai = require("chai");

var _fs = _interopRequireDefault(require("fs"));

var _hooks = require("../hooks");

var _path = _interopRequireDefault(require("path"));

var _pluginApi = _interopRequireDefault(require("../plugin-api"));

var _sinon = _interopRequireDefault(require("sinon"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

describe('PluginAPI', () => {
  let api;

  const base = _path.default.join(__dirname, '../../tests/fixtures/project-unit-tests');

  const filteredArgs = ['--tail'];
  const program = {
    verbose: true
  };
  beforeEach(() => {
    api = new _pluginApi.default(base, filteredArgs, program);
  });
  describe('configPath', () => {
    it('should prefer --config option', () => {
      const _api = new _pluginApi.default(base, filteredArgs, {
        config: '~/project2/.deploy/mup.js'
      });

      (0, _chai.expect)(_api.configPath).to.include('project2');
    });
    it('should fallback to base', () => {
      (0, _chai.expect)(api.configPath).to.equal(_path.default.join(base, 'mup.js'));
    });
  });
  describe('base', () => {
    it('should prefer config path', () => {
      const _api = new _pluginApi.default(base, filteredArgs, {
        config: '~/project2/.deploy/mup.js'
      });

      (0, _chai.expect)(_api.base).to.equal('~/project2/.deploy');
    });
    it('should fallback to given base', () => {
      (0, _chai.expect)(api.base).to.equal(base);
    });
  });
  describe('properties', () => {
    it('should have "program"', () => {
      (0, _chai.expect)(api).has.property('program');
    });
    it('should have "commandHistory"', () => {
      (0, _chai.expect)(api).has.property('commandHistory');
    });
  });
  describe('utils', () => {
    it('should have resolvePath', () => {
      (0, _chai.expect)(api.resolvePath).to.be.a('function');
    });
    it('should have runTaskList', () => {
      (0, _chai.expect)(api.runTaskList).to.be.a('function');
    });
    it('should have getDockerLogs', () => {
      (0, _chai.expect)(api.getDockerLogs).to.be.a('function');
    });
    it('should have runSSHCommand', () => {
      (0, _chai.expect)(api.runSSHCommand).to.be.a('function');
    });
  });
  describe('getArgs', () => {
    it('should return args', () => {
      (0, _chai.expect)(api.getArgs()).to.equal(filteredArgs);
    });
  });
  describe('getBasePath', () => {
    it('should return base', () => {
      (0, _chai.expect)(api.getBasePath()).to.equal(base);
    });
  });
  describe('getVerbose', () => {
    it('should return verbose', () => {
      (0, _chai.expect)(api.getVerbose()).to.equal(true);
    });
  });
  describe('getOptions', () => {
    it('should return options', () => {
      (0, _chai.expect)(api.getOptions()).to.equal(program);
    });
  });
  describe('hasMeteorPackage', () => {
    let fsStub;
    let configStub;
    beforeEach(() => {
      fsStub = _sinon.default.stub(_fs.default, 'readFileSync').callsFake(() => ({
        toString() {
          return `
            package1@3
            package2@3
            #package3@3
            `;
        }

      }));
      configStub = _sinon.default.stub(api, 'getConfig').callsFake(() => ({
        meteor: {
          path: '../'
        }
      }));
    });
    afterEach(() => {
      fsStub.restore();
      configStub.restore();
    });
    it('should return true if package is used', () => {
      (0, _chai.expect)(api.hasMeteorPackage('package2')).to.equal(true);
    });
    it('should ignore commented out lines', () => {
      (0, _chai.expect)(api.hasMeteorPackage('package3')).to.equal(false);
    });
    it('should return false if could not find app', () => {
      fsStub.restore();
      (0, _chai.expect)(api.hasMeteorPackage('package2')).to.equal(false);
    });
  });
  describe('validateConfig', () => {
    const errors = {
      errors: ['error1', 'error2'],
      depreciations: []
    };
    let validatorStub;
    let totalConsoleOutput = '';
    let consoleStub;
    beforeEach(() => {
      totalConsoleOutput = '';
      validatorStub = _sinon.default.stub(validate, 'default').returns(errors);
      consoleStub = _sinon.default.stub(console, 'log').callsFake((...text) => {
        totalConsoleOutput += text.join(' ');
      });
    });
    afterEach(() => {
      validatorStub.restore();
      consoleStub.restore();
    });
    it('should show validation errors', () => {
      api.validateConfig(api.configPath);
      consoleStub.restore();
      (0, _chai.expect)(totalConsoleOutput).to.contain('- error1');
      (0, _chai.expect)(totalConsoleOutput).to.contain('- error2');
    });
    it('should show nothing when config is valid', () => {
      errors.errors = [];
      errors.depreciations = [];
      api.validateConfig(api.configPath);
      (0, _chai.expect)(totalConsoleOutput).to.equal('');
    });
  });
  describe('_normalizeConfig', () => {
    it('should copy meteor object to app', () => {
      const expected = {
        meteor: {
          path: '../'
        },
        app: {
          type: 'meteor',
          path: '../',
          docker: {
            image: 'kadirahq/meteord',
            imagePort: 3000,
            stopAppDuringPrepareBundle: true
          }
        }
      };
      const config = {
        meteor: {
          path: '../'
        }
      };

      const result = api._normalizeConfig(config);

      (0, _chai.expect)(result).to.deep.equal(expected);
    });
  });
  describe('setConfig', () => {
    it('should update the old config', () => {
      const newConfig = {
        servers: {
          two: 0
        }
      };
      api.setConfig(newConfig);
      (0, _chai.expect)(api.getConfig()).to.deep.equal(newConfig);
    });
  });
  describe('runCommand', () => {
    let commandCalled = false;
    let preHookCalled = false;
    let postHookCalled = false;
    beforeEach(() => {
      _hooks.hooks['pre.test.logs'] = [{
        method() {
          preHookCalled = true;
        }

      }];
      _hooks.hooks['post.test.logs'] = [{
        method() {
          postHookCalled = true;
        }

      }];
      _commands.commands['test.logs'] = {
        handler() {
          commandCalled = true;
        }

      };
      commandCalled = false;
      preHookCalled = false;
      postHookCalled = false;
    });
    after(() => {
      delete _hooks.hooks['pre.test.logs'];
      delete _hooks.hooks['post.test.logs'];
      delete _commands.commands['test.logs'];
    });
    it('should throw if name is not provided', cb => {
      api.runCommand().catch(() => {
        cb();
      });
    });
    it('should throw if unknown command', cb => {
      api.runCommand('nonexistent.command').catch(() => {
        cb();
      });
    });
    it('should run command', cb => {
      api.runCommand('test.logs').then(() => {
        (0, _chai.expect)(commandCalled).to.equal(true);
        cb();
      });
    });
    it('should run hooks', cb => {
      api.runCommand('test.logs').then(() => {
        (0, _chai.expect)(preHookCalled).to.equal(true);
        (0, _chai.expect)(postHookCalled).to.equal(true);
        cb();
      }).catch(e => {
        console.log(e);
      });
    });
    it('should update commandHistory', () => {
      api.runCommand('test.logs');
      (0, _chai.expect)(api.commandHistory).to.deep.equal([{
        name: 'test.logs'
      }]);
    });
  });
  describe('getSessions', () => {
    it('should return sessions for plugins', () => {
      const sessions = api.getSessions(['meteor', 'mongo']);
      (0, _chai.expect)(sessions).to.have.length(2);
    });
  });
  describe('_loadSessions', () => {
    it('should add sessions to this.sessions', () => {
      api._loadSessions();

      (0, _chai.expect)(api.sessions).to.have.keys('one', 'two');
    });
  });
  describe('_pickSessions', () => {
    it('should return sessions for each plugin', () => {
      const result = api._pickSessions(['meteor', 'mongo']);

      (0, _chai.expect)(result).to.have.keys('one', 'two');
    });
  });
});
//# sourceMappingURL=plugin-api.unit.js.map