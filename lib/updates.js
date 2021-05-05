"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _lodash = require("lodash");

var _axios = _interopRequireDefault(require("axios"));

var _boxen = _interopRequireDefault(require("boxen"));

var _chalk = _interopRequireDefault(require("chalk"));

var _debug = _interopRequireDefault(require("debug"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)('mup:updates');
const SKIP_CHECK_UPDATE = process.env.MUP_SKIP_UPDATE_CHECK === 'true';

function parseVersion(version) {
  return (0, _lodash.flatMap)(version.split('.'), n => n.split('-beta').filter(segment => segment.length > 0).map(Number));
}

function newerStable(local, remote) {
  for (let i = 0; i < 3; i++) {
    for (let sameIndex = 0; sameIndex < i; sameIndex += 1) {
      if (local[sameIndex] !== remote[sameIndex]) {
        return false;
      }
    }

    if (local[i] < remote[i]) {
      return true;
    }
  }

  return false;
}

function compareVersions(local, remote, next) {
  const beta = local.length > 3;
  let isStable = true;
  let available = newerStable(local, remote);

  if (beta && !available) {
    // check if stable version for beta is available
    available = (0, _lodash.isEqual)(remote, local.slice(0, 3));
  }

  if (beta && !available) {
    // check if newer beta is available
    available = next[3] > local[3];
    isStable = false;
  }

  return {
    available,
    isStable
  };
}

function showUpdateOnExit(pkg, version, isStable) {
  const command = isStable ? `npm i -g ${pkg.name}` : `npm i -g ${pkg.name}@next`;
  let text = `Update available for ${pkg.name}`;
  text += `\n${pkg.version} => ${version}`;
  text += `\nTo update, run ${_chalk.default.green(command)}`;
  process.on('exit', () => {
    console.log((0, _boxen.default)(text, {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'yellow'
    }));
  });
}

function checkPackageUpdates(name, pkg) {
  log(`retrieving tags for ${name}`);
  return _axios.default.get(`https://registry.npmjs.org/-/package/${name}/dist-tags`).then(({
    data
  }) => {
    const npmVersion = data.latest || '0.0.0';
    const nextVersion = data.next || '0.0.0';
    const local = parseVersion(pkg.version);
    const remote = parseVersion(npmVersion);
    const next = parseVersion(nextVersion);
    const {
      available,
      isStable
    } = compareVersions(local, remote, next);
    log(`finished update check for ${name}`);

    if (available) {
      showUpdateOnExit(pkg, isStable ? npmVersion : nextVersion, isStable);
    }
  }).catch(e => {
    // It is okay if this fails
    log(e);
  });
}

function _default(packages) {
  log('checking for updates');
  log('Packages: ', packages);

  if (SKIP_CHECK_UPDATE) {
    log('skipping update check');
    return;
  }

  packages.forEach(({
    name,
    path: packagePath
  }) => {
    try {
      const packageJsonPath = _path.default.resolve(_path.default.dirname(packagePath), 'package.json'); // eslint-disable-next-line global-require


      const pkg = require(packageJsonPath);

      checkPackageUpdates(name, pkg);
    } catch (e) {
      // It is okay if this fails
      log(e);
    }
  });
}
//# sourceMappingURL=updates.js.map