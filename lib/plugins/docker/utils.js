"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkVersion = checkVersion;
exports.shouldShowDockerWarning = shouldShowDockerWarning;
const minMajor = 18;

function checkVersion(version = '') {
  const parts = version.trim().split('.');
  let valid = true;

  if (parseInt(parts[0], 10) < minMajor) {
    valid = false;
  }

  return valid;
}

function shouldShowDockerWarning(dockers) {
  if (dockers.length === 0) {
    return false;
  }

  const nbDockers = dockers.length;
  const baseVersion = dockers[0].version;
  const sameVersions = dockers.filter(docker => docker.version === baseVersion);

  if (sameVersions.length === nbDockers) {
    return false;
  }

  return true;
}
//# sourceMappingURL=utils.js.map