"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.status = exports.nginxConfig = exports.stop = exports.start = exports.envconfig = exports.leLogs = exports.logs = exports.reconfigShared = exports.setup = void 0;

var commandHandlers = _interopRequireWildcard(require("./command-handlers"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const setup = {
  description: 'Setup and start proxy',
  handler: commandHandlers.setup
};
exports.setup = setup;
const reconfigShared = {
  name: 'reconfig-shared',
  description: 'Reconfigure shared properties',
  handler: commandHandlers.reconfigShared
};
exports.reconfigShared = reconfigShared;
const logs = {
  description: 'View logs for proxy',

  builder(yargs) {
    return yargs.strict(false);
  },

  handler: commandHandlers.logs
};
exports.logs = logs;
const leLogs = {
  name: 'logs-le',
  description: 'View logs for Let\'s Encrypt',

  builder(yargs) {
    return yargs.strict(false);
  },

  handler: commandHandlers.leLogs
};
exports.leLogs = leLogs;
const envconfig = {
  description: 'Configure environment variables for proxy',
  handler: commandHandlers.envconfig
};
exports.envconfig = envconfig;
const start = {
  description: 'Start proxy and let\'s encrypt containers',
  handler: commandHandlers.start
};
exports.start = start;
const stop = {
  description: 'Stop proxy',
  handler: commandHandlers.stop
};
exports.stop = stop;
const nginxConfig = {
  name: 'nginx-config',
  description: 'View generated nginx config',
  handler: commandHandlers.nginxConfig
};
exports.nginxConfig = nginxConfig;
const status = {
  description: 'View the proxy\'s status',
  handler: commandHandlers.status
};
exports.status = status;
//# sourceMappingURL=commands.js.map