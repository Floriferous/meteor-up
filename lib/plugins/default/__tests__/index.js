"use strict";

var _mocha = require("mocha");

var _chai = _interopRequireWildcard(require("chai"));

var _utils = require("../../../utils");

var _chaiString = _interopRequireDefault(require("chai-string"));

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _shelljs = _interopRequireDefault(require("shelljs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/* eslint-disable no-unused-expressions */
_chai.default.use(_chaiString.default);

_shelljs.default.config.silent = false;

const servers = require('../../../../tests/fixtures/servers');

(0, _mocha.describe)('module - default', function () {
  this.timeout(900000);
  (0, _mocha.before)(async () => {
    const serverInfo = servers.mymeteor;
    await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker rm -f $(sudo docker ps -a -q)');
  });
  (0, _mocha.describe)('deploy', () => {
    (0, _mocha.it)('should deploy meteor app on "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup');

      const out = _shelljs.default.exec('mup deploy --cached-build');

      (0, _chai.expect)(out.code).to.equal(0);
      (0, _chai.expect)(out.output).satisfy(text => {
        if (text.indexOf('Building App Bundle Locally') > -1) {
          return true;
        }

        return text.indexOf('Using build from previous deploy at') > -1;
      });
      (0, _chai.expect)((0, _utils.countOccurences)('Pushing Meteor App Bundle to the Server: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Pushing the Startup Script: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
      const ssh1 = await (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017');
      (0, _chai.expect)(ssh1.code).to.be.equal(0);
      const ssh2 = await (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');
      (0, _chai.expect)(ssh2.code).to.be.equal(0);
    });
  });
  (0, _mocha.describe)('init', () => {
    (0, _mocha.it)('should create "mup.js" and "setting.json" in /tmp/project-tmp', () => {
      const dir = _path.default.resolve(_os.default.tmpdir(), 'project-tmp');

      _shelljs.default.mkdir(dir);

      _shelljs.default.cd(dir);

      _shelljs.default.exec('mup init');

      (0, _chai.expect)(_fs.default.existsSync(_path.default.resolve(dir, 'mup.js'))).to.true;
      (0, _chai.expect)(_fs.default.existsSync(_path.default.resolve(dir, 'settings.json'))).to.true;

      _shelljs.default.rm('-rf', dir);
    });
  });
  (0, _mocha.describe)('logs', () => {
    (0, _mocha.it)('should pull the logs from meteor app', () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      const out = _shelljs.default.exec('mup logs --tail 2');

      (0, _chai.expect)(out.code).to.be.equal(0);
    });
  });
  (0, _mocha.describe)('reconfig', () => {
    (0, _mocha.it)('should reconfig meteor app on "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup  && mup deploy --cached-build');

      const out = _shelljs.default.exec('mup reconfig');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((await (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(0);
    });
  });
  (0, _mocha.describe)('restart', () => {
    (0, _mocha.it)('should restart meteor app on "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup  && mup deploy --cached-build');

      const out = _shelljs.default.exec('mup restart');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)(out.output).to.have.entriesCount('Stop Meteor: SUCCESS', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('Start Meteor: SUCCESS', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('Verifying Deployment: SUCCESS', 1);
      (0, _chai.expect)((await (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(0, 'Curl exit code');
    });
  });
  (0, _mocha.describe)('setup', () => {
    (0, _mocha.it)('should setup "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      const out = _shelljs.default.exec('mup setup');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('Setup Docker: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Setup Environment: SUCCESS', out.output)).to.be.equal(2);
      (0, _chai.expect)((0, _utils.countOccurences)('Start Mongo: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((await (0, _utils.runSSHCommand)(serverInfo, 'nc -z -v -w5 localhost 27017')).code).to.be.equal(0);
    });
  });
  (0, _mocha.describe)('start', () => {
    (0, _mocha.it)('should start meteor app on "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup  && mup meteor push --cached-build && mup meteor envconfig');

      const out = _shelljs.default.exec('mup start');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((0, _utils.countOccurences)('Verifying Deployment: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((await (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(0);
    });
  });
  (0, _mocha.describe)('stop', () => {
    (0, _mocha.it)('should stop meteor app on "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup  && mup deploy --cached-build');

      const out = _shelljs.default.exec('mup stop');

      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('Stop Meteor: SUCCESS', out.output)).to.be.equal(1);
      (0, _chai.expect)((await (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0')).code).to.be.equal(7);
    });
  });
  (0, _mocha.describe)('syslog', () => {
    const serverInfo = servers.mymeteor;
    (0, _mocha.it)('should write meteor logs to syslog on "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-2'));

      _shelljs.default.exec('mup setup && mup deploy --cached-build');

      const out = await (0, _utils.runSSHCommand)(serverInfo, 'sudo tail -n 100 /var/log/syslog');
      (0, _chai.expect)(out.code).to.be.equal(0);
      (0, _chai.expect)((0, _utils.countOccurences)('=> Starting meteor app on port 3000', out.output)).gte(1);
    });
  });
});
//# sourceMappingURL=index.js.map