"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerPreparer = registerPreparer;
exports.runConfigPreps = runConfigPreps;
exports._configPreps = void 0;
const _configPreps = [];
exports._configPreps = _configPreps;

function registerPreparer(preparer) {
  _configPreps.push(preparer);
}

function runConfigPreps(_config) {
  let config = _config;

  _configPreps.forEach(preparer => {
    config = preparer(config) || config;
  });

  return config;
}
//# sourceMappingURL=prepare-config.js.map