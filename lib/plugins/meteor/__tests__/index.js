"use strict";

var _mocha = require("mocha");

var _chai = _interopRequireWildcard(require("chai"));

var _utils = require("../../../utils");

var _assert = _interopRequireDefault(require("assert"));

var _chaiString = _interopRequireDefault(require("chai-string"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _shelljs = _interopRequireDefault(require("shelljs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

_chai.default.use(_chaiString.default);

_shelljs.default.config.silent = false;

const servers = require('../../../../tests/fixtures/servers');

(0, _mocha.describe)('module - meteor', function () {
  this.timeout(600000);
  (0, _mocha.before)(async () => {
    const serverInfo = servers.mymeteor;
    await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker rm -f $(sudo docker ps -a -q)');
  });
  (0, _mocha.describe)('setup', () => {
    (0, _mocha.it)('should setup environment on "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;
      await (0, _utils.runSSHCommand)(serverInfo, 'rm -rf /opt/myapp || :');
      await (0, _utils.runSSHCommand)(serverInfo, 'command -v tree >/dev/null 2>&1 || { sudo apt-get -qq update && sudo apt-get -qq install -y tree; }');

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      const out = _shelljs.default.exec('mup meteor setup');

      _assert.default.equal(out.code, 0);

      const num = (0, _utils.countOccurences)('Setup Environment: SUCCESS', out.output);

      _assert.default.equal(num, 1);

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'tree -pufid /opt');
      (0, _chai.expect)(sshOut.output).to.have.entriesCount('/opt/myapp', 3);
      (0, _chai.expect)(sshOut.output).to.have.entriesCount('/opt/myapp/config', 1);
      (0, _chai.expect)(sshOut.output).to.have.entriesCount('/opt/myapp/tmp', 1);
    });
  });
  (0, _mocha.describe)('push', () => {
    (0, _mocha.it)('should push meteor app bundle to "meteor" vm', async () => {
      const serverInfo = servers.mymeteor;

      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup docker setup');

      _shelljs.default.exec('mup meteor setup');

      const out = _shelljs.default.exec('mup meteor push --cached-build');

      _assert.default.equal(out.code, 0);

      const num = (0, _utils.countOccurences)('Pushing Meteor App Bundle to the Server: SUCCESS', out.output);

      _assert.default.equal(num, 1);

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'ls -al /opt/myapp/tmp/bundle.tar.gz');

      _assert.default.equal(sshOut.code, 0);
    });
    (0, _mocha.it)('should handle env vars with space during Prepare Bundle', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup docker setup');

      _shelljs.default.exec('mup meteor setup');

      const out = _shelljs.default.exec('mup --config mup.env-with-space.js meteor push --cached-build');

      _assert.default.equal(out.code, 0);

      const num = (0, _utils.countOccurences)('Prepare Bundle: SUCCESS', out.output);

      _assert.default.equal(num, 1);
    });
  });
  (0, _mocha.describe)('envconfig', () => {
    const serverInfo = servers.mymeteor;
    (0, _mocha.it)('should send the environment variables to "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup meteor setup');

      const out = _shelljs.default.exec('mup meteor envconfig');

      _assert.default.equal(out.code, 0);

      const num = (0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output);

      _assert.default.equal(num, 1);

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'ls -al /opt/myapp/config/env.list');

      _assert.default.equal(sshOut.code, 0);

      const sshOut2 = await (0, _utils.runSSHCommand)(serverInfo, 'ls -al /opt/myapp/config/start.sh');

      _assert.default.equal(sshOut2.code, 0);
    });
    (0, _mocha.it)('should push server specific env variables', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-2'));

      _shelljs.default.exec('mup meteor setup');

      const out = _shelljs.default.exec('mup meteor envconfig');

      (0, _chai.expect)(out.code).to.equal(0);
      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'cat /opt/myapp/config/env.list');
      (0, _chai.expect)(sshOut.output).to.have.entriesCount('TEST=true', 1);
    });
  });
  (0, _mocha.describe)('start', () => {
    const serverInfo = servers.mymeteor;
    (0, _mocha.it)('should start meteor on "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup && mup meteor push --cached-build && mup meteor envconfig');

      const out = _shelljs.default.exec('mup meteor start');

      _assert.default.equal(out.code, 0);

      const num = (0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output);

      _assert.default.equal(num, 1);

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

      _assert.default.equal(sshOut.code, 0);
    });
  });
  (0, _mocha.describe)('deploy', () => {
    const serverInfo = servers.mymeteor;
    (0, _mocha.before)(async () => {
      await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker network create mup-tests');
    });

    async function checkDeploy(out, appText, port = 80) {
      _assert.default.equal(out.code, 0);

      const num = (0, _utils.countOccurences)('Sending Environment Variables: SUCCESS', out.output);

      _assert.default.equal(num, 1);

      const num2 = (0, _utils.countOccurences)('Start Meteor: SUCCESS', out.output);

      _assert.default.equal(num2, 1);

      const num3 = (0, _utils.countOccurences)('Pushing Meteor App Bundle to the Server: SUCCESS', out.output);

      _assert.default.equal(num3, 1);

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, `curl localhost:${port} && exit 0`);

      _assert.default.equal(sshOut.code, 0);

      (0, _chai.expect)(sshOut.output).to.have.entriesCount(appText, 1);
    }

    (0, _mocha.it)('should deploy meteor app on "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup');

      const out = _shelljs.default.exec('mup meteor deploy --cached-build');

      await checkDeploy(out, '<title>helloapp-new</title>');
    });
    (0, _mocha.it)('should deploy app using Meteor 1.2', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup --config mup.old.js');

      const out = _shelljs.default.exec('mup meteor deploy --cached-build --config mup.old.js');

      (0, _chai.expect)(out.code).to.equal(0);
      await checkDeploy(out, '<title>helloapp</title>');
    });
    (0, _mocha.it)('should connect to user networks', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup');

      const out = _shelljs.default.exec('mup deploy --cached-build --config mup.user-network.js');

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker inspect myapp');
      const networks = JSON.parse(sshOut.output)[0].NetworkSettings.Networks;
      (0, _chai.expect)(Object.keys(networks)).to.deep.equal(['bridge', 'mup-tests']);
      (0, _chai.expect)(out.code).to.equal(0);
      await checkDeploy(out, '<title>helloapp-new</title>');
    });
    (0, _mocha.it)('should verify deployment when not connected to bridge network', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup');

      const out = _shelljs.default.exec('mup deploy --cached-build --config mup.no-bridge.js');

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker inspect myapp');
      const networks = JSON.parse(sshOut.output)[0].NetworkSettings.Networks;
      await checkDeploy(out, '<title>helloapp-new</title>');
      (0, _chai.expect)(Object.keys(networks)).to.deep.equal(['mup-tests']);
      (0, _chai.expect)(out.code).to.equal(0);
    });
    (0, _mocha.it)('should use Docker buildkit when enabled', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup');

      const out = _shelljs.default.exec('mup meteor push --cached-build --config mup.buildkit.js --verbose');

      (0, _chai.expect)(out.code).to.equal(0);
      (0, _chai.expect)(out.output).to.have.entriesCount('#12 naming to docker.io/library/mup-myapp:build done', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('Prepare Bundle: SUCCESS', 1);
    });
    (0, _mocha.it)('should allow overriding PORT on specific servers', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup --config mup.override-port.js setup');

      const out = _shelljs.default.exec('mup meteor deploy --config mup.override-port.js --cached-build');

      await checkDeploy(out, '<title>helloapp-new</title>', 4000);

      const status = _shelljs.default.exec('mup --config mup.override-port.js meteor status');

      (0, _chai.expect)(status.output).to.have.entriesCount('- 3000/tcp => 4000', 1);
      (0, _chai.expect)(status.output).to.have.entriesCount(`App running at http://${serverInfo.host}:4000`, 1);
      (0, _chai.expect)(status.output).to.have.entriesCount('Available in app\'s docker container: true', 1);
      (0, _chai.expect)(status.output).to.have.entriesCount('Available on server: true', 1);
    });
  });
  (0, _mocha.describe)('logs', () => {
    (0, _mocha.it)('should pull the logs from "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      const out = _shelljs.default.exec('mup meteor logs --tail 2');

      _assert.default.equal(out.code, 0);
    });
  });
  (0, _mocha.describe)('stop', () => {
    const serverInfo = servers.mymeteor;
    (0, _mocha.it)('should stop meteor app on "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-1'));

      _shelljs.default.exec('mup setup && mup deploy --cached-build');

      const out = _shelljs.default.exec('mup meteor stop');

      _assert.default.equal(out.code, 0);

      const num = (0, _utils.countOccurences)('Stop Meteor: SUCCESS', out.output);

      _assert.default.equal(num, 1);

      const sshOut = await (0, _utils.runSSHCommand)(serverInfo, 'curl localhost:80 && exit 0');

      _assert.default.equal(sshOut.code, 7);
    });
  });
});
//# sourceMappingURL=index.js.map