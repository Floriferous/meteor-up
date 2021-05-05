"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.destroyCluster = exports.update = exports.status = exports.ps = exports.restart = exports.setup = void 0;

var commandHandlers = _interopRequireWildcard(require("./command-handlers"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const setup = {
  description: 'Install and start docker',
  handler: commandHandlers.setup
};
exports.setup = setup;
const restart = {
  description: 'Restart docker daemon',
  handler: commandHandlers.restart
};
exports.restart = restart;
const ps = {
  description: 'View running containers. Accepts same options as docker ps',

  builder(builder) {
    return builder.strict(false);
  },

  handler: commandHandlers.ps
};
exports.ps = ps;
const status = {
  description: 'View status of docker swarm',
  handler: commandHandlers.status
};
exports.status = status;
const update = {
  description: 'Update docker',
  handler: commandHandlers.update
};
exports.update = update;
const destroyCluster = {
  name: 'destroy-cluster',
  description: 'Destroy swarm cluster',
  handler: commandHandlers.removeSwarm
};
exports.destroyCluster = destroyCluster;
//# sourceMappingURL=commands.js.map