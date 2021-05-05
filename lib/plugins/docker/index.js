"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.swarmOptions = swarmOptions;
exports.scrubConfig = scrubConfig;
exports.validate = exports.hooks = exports.commands = exports.description = void 0;

var _commands = _interopRequireWildcard(require("./commands"));

var _validate = require("./validate");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const description = 'Setup and manage docker';
exports.description = description;
const commands = _commands;
exports.commands = commands;
const hooks = {
  'post.default.status'(api) {
    return api.runCommand('docker.status');
  }

};
exports.hooks = hooks;
const validate = {
  swarm: _validate.validateSwarm,
  privateDockerRegistry: _validate.validateRegistry
};
exports.validate = validate;

function swarmOptions(config) {
  if (config && config.swarm) {
    return {
      labels: config.swarm.labels || []
    };
  }
}

function scrubConfig(config) {
  if (!config.privateDockerRegistry) {
    return config;
  }

  const {
    username,
    password
  } = config.privateDockerRegistry;

  if (username) {
    config.privateDockerRegistry.username = 'username';
  }

  if (password) {
    config.privateDockerRegistry.password = 'password';
  }

  return config;
}
//# sourceMappingURL=index.js.map