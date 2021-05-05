"use strict";

var _chai = _interopRequireWildcard(require("chai"));

var _mocha = require("mocha");

var _chaiString = _interopRequireDefault(require("chai-string"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _utils = require("../../../utils");

var _shelljs = _interopRequireDefault(require("shelljs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

_chai.default.use(_chaiString.default);

_shelljs.default.config.silent = false;

const servers = require('../../../../tests/fixtures/servers');

function cdSwarmProject() {
  _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-swarm'));
}

async function checkRunning() {
  const serverInfo = servers.mymeteor;
  const sshService = await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker service inspect myapp-service');
  (0, _chai.expect)(sshService.code).to.equal(0); // TODO: for the app to run without repeatedly crashing
  // we need to run a mongo instance that can be connected to
  // from the swarm service
  // const sshOut = await runSSHCommand(
  //   serverInfo,
  //   'curl localhost:80'
  // );
  // expect(sshOut.code).to.equal(0);
}

(0, _mocha.describe)('module - meteor swarm', function () {
  this.timeout(600000);
  this.afterAll(() => {
    cdSwarmProject();

    _shelljs.default.exec('mup docker destroy-cluster');
  });
  (0, _mocha.describe)('envconfig', () => {
    (0, _mocha.it)('should not run when swarm is enabled', async () => {
      cdSwarmProject();

      _shelljs.default.exec('mup setup && mup meteor push --cached-build');

      const out = _shelljs.default.exec('mup meteor envconfig');

      (0, _chai.expect)(out.code).to.equal(0);
      (0, _chai.expect)(out.output).to.have.entriesCount('Sending Environment Variables', 0);
    });
  });
  (0, _mocha.describe)('start', () => {
    (0, _mocha.it)('should create service', async () => {
      cdSwarmProject();

      _shelljs.default.exec('mup setup && mup meteor push --cached-build');

      const out = _shelljs.default.exec('mup meteor start');

      (0, _chai.expect)(out.code).to.equal(0);
      await checkRunning();
    });
  });
  (0, _mocha.describe)('stop', () => {
    (0, _mocha.it)('should remove service', async () => {
      const serverInfo = servers.mymeteor;
      cdSwarmProject();

      _shelljs.default.exec('mup setup && mup meteor deploy --cached-build');

      const out = _shelljs.default.exec('mup meteor stop');

      (0, _chai.expect)(out.output).to.have.entriesCount('Stop myapp-service: SUCCESS', 1);
      const sshService = await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker service inspect myapp-service');
      (0, _chai.expect)(sshService.code).to.equal(1);
    });
  });
  (0, _mocha.describe)('restart', () => {
    (0, _mocha.it)('should restart the service', async () => {
      cdSwarmProject();

      _shelljs.default.exec('mup setup && mup meteor deploy --cached-build');

      const out = _shelljs.default.exec('mup meteor restart');

      (0, _chai.expect)(out.output).to.have.entriesCount('Restart myapp-service: SUCCESS', 1);
      await checkRunning();
    });
  });
  (0, _mocha.describe)('logs', () => {
    (0, _mocha.it)('should show service logs', async () => {
      cdSwarmProject();

      _shelljs.default.exec('mup setup && mup meteor deploy --cached-build');

      const out = _shelljs.default.exec('mup meteor logs --tail 2');

      (0, _chai.expect)(out.output.indexOf('=> Starting meteor app on port 3000')).to.be.greaterThan(-1);
    });
  });
});
//# sourceMappingURL=swarm.js.map