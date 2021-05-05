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

const servers = require('../../../../tests/fixtures/servers');

_chai.default.use(_chaiString.default);

_shelljs.default.config.silent = false;
(0, _mocha.describe)('module - proxy', function () {
  this.timeout(60000000);
  const serverInfo = servers.mymeteor;
  before(async () => {
    await (0, _utils.runSSHCommand)(serverInfo, 'docker rm -f $(docker ps -a -q)');
  });
  (0, _mocha.describe)('setup', () => {
    (0, _mocha.it)('should setup proxy on "meteor" vm', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-3'));

      let out = _shelljs.default.exec('mup setup');

      (0, _chai.expect)(out.code).to.equal(0);
      (0, _chai.expect)(out.output).to.have.entriesCount('Setup proxy', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);
      out = await (0, _utils.runSSHCommand)(serverInfo, 'sudo docker ps');
      (0, _chai.expect)(out.code).to.equal(0);
      (0, _chai.expect)(out.output).to.have.entriesCount('mup-nginx-proxy', 2);
      (0, _chai.expect)(out.output).to.have.entriesCount('mup-nginx-proxy-letsencrypt', 1);
      out = await (0, _utils.runSSHCommand)(serverInfo, 'du --max-depth=2 /opt');
      (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy', 5);
      (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/certs', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/mounted-certs', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/config', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('/opt/mup-nginx-proxy/upstream', 1);
      out = await (0, _utils.runSSHCommand)(serverInfo, 'ls /opt/mup-nginx-proxy/config');
      (0, _chai.expect)(out.output).to.have.entriesCount('shared-config.sh', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('env.list', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('env_letsencrypt.list', 1);
    });
  });
  (0, _mocha.describe)('reconfig-shared', () => {
    (0, _mocha.it)('it should update shared settings', async () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-3'));

      _shelljs.default.exec('mup setup');

      let out = _shelljs.default.exec('mup proxy reconfig-shared');

      (0, _chai.expect)(out.code).to.equal(0);
      (0, _chai.expect)(out.output).to.have.entriesCount('Configuring Proxy\'s Shared Settings', 1);
      (0, _chai.expect)(out.output).to.have.entriesCount('Start proxy: SUCCESS', 1);
      out = await (0, _utils.runSSHCommand)(serverInfo, 'cat /opt/mup-nginx-proxy/config/shared-config.sh');
      (0, _chai.expect)(out.output).to.have.entriesCount('CLIENT_UPLOAD_LIMIT=10M', 1);
    });
  });
  (0, _mocha.describe)('logs', () => {
    (0, _mocha.it)('should show nginx logs', () => {
      _shelljs.default.cd(_path.default.resolve(_os.default.tmpdir(), 'tests/project-3'));

      _shelljs.default.exec('mup setup');

      const out = _shelljs.default.exec('mup proxy logs --tail 2');

      (0, _chai.expect)(out.output).to.have.entriesCount('Received event start for', 1);
      (0, _chai.expect)(out.code).to.equal(0);
    });
  });
});
//# sourceMappingURL=index.js.map