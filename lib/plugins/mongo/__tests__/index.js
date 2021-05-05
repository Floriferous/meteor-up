"use strict";

var _utils = require("../../../utils");

var _mocha = require("mocha");

var _chai = require("chai");

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _shelljs = _interopRequireDefault(require("shelljs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const servers = require('../../../../tests/fixtures/servers');

_shelljs.default.config.silent = false;
(0, _mocha.describe)('module - mongo', function () {
  this.timeout(600000);
  (0, _mocha.describe)('logs', () => {
    (0, _mocha.it)('should pull logs from "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup');

      const out = _shelljs.default.exec('mup mongo logs');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('MongoDB starting :', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('db version', out.output)).to.be.equal(1);
    });
  });
  (0, _mocha.describe)('setup', () => {
    (0, _mocha.it)('should setup mongodb on "mongo" vm', async () => {
      const serverInfo = servers.mymongo;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      const out = _shelljs.default.exec('mup mongo setup');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('Setup Environment: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Copying Mongo Config: SUCCESS', out.output)).to.be.equal(1);
      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'tree -pufi /opt');
      (0, _chai.expect)(sshOut.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('mongo-start-new.sh', sshOut.output)).to.be.equal(1);
    });
  });
  (0, _mocha.describe)('start', () => {
    (0, _mocha.it)('should start mongodb on "mongo" vm', async () => {
      const serverInfo = servers.mymongo;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup docker setup && mup mongo setup');

      const out = _shelljs.default.exec('mup mongo start');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('Start Mongo: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((await (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017')).code).to.be.equal(0);
    });
    (0, _mocha.it)('should allow configuring db name', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      const out = _shelljs.default.exec('mup --config mup.db-name.js validate --show');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('mongodb://mongodb:27017/test-db', out.output)).to.be.equal(1);
    });
  });
  (0, _mocha.describe)('stop', () => {
    (0, _mocha.it)('should stop mongodb on "mongo" vm', async () => {
      const serverInfo = servers.mymongo;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup docker setup && mup mongo setup && mup mongo start');

      const out = _shelljs.default.exec('mup mongo stop');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('Stop Mongo: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((await (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017')).code).to.be.equal(1);
    });
  });
});
//# sourceMappingURL=index.js.map