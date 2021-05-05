"use strict";

var _utils = require("../../../utils");

var _mocha = require("mocha");

var _assert = _interopRequireDefault(require("assert"));

var _os = _interopRequireDefault(require("os"));

var _shelljs = _interopRequireDefault(require("shelljs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_shelljs.default.config.silent = false;

const servers = require('../../../../tests/fixtures/servers');

(0, _mocha.describe)('module - docker', function () {
  this.timeout(6000000);
  (0, _mocha.describe)('setup', () => {
    // reuse this function for 3 tests below
    // TODO break this into multiple functions
    // so parts can be used for other tests
    function checkDocker(name) {
      // TODO get server name form mup.js file
      const serverInfo = servers[`my${name}`];
      return async function () {
        this.timeout(60000);

        _shelljs.default.cd((0, _utils.resolvePath)(_os.default.tmpdir(), 'tests/project-1'));

        const out = _shelljs.default.exec('mup docker setup');

        _assert.default.equal(out.code, 0);

        const num = (0, _utils.countOccurences)('Setup Docker: SUCCESS', out.output);

        _assert.default.equal(num, 1);

        const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'which docker');

        _assert.default.equal(sshOut.code, 0);
      };
    }

    (0, _mocha.it)('should install docker on "meteor" vm', checkDocker('meteor'));
    (0, _mocha.it)('should install docker on "mongo" vm', checkDocker('mongo'));
    (0, _mocha.it)('should install docker on "proxy" vm', checkDocker('proxy'));
  });
});
//# sourceMappingURL=index.js.map