"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.status = exports.validate = exports.ssh = exports.stop = exports.start = exports.setup = exports.restart = exports.reconfig = exports.logs = exports.deploy = exports.init = void 0;

var commandHandlers = _interopRequireWildcard(require("./command-handlers"));

var _init = _interopRequireDefault(require("./init"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const init = {
  description: 'Setup files for new mup project',
  handler: _init.default
};
exports.init = init;
const deploy = {
  description: 'Deploy app to server',

  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },

  handler: commandHandlers.deploy
};
exports.deploy = deploy;
const logs = {
  description: 'Show app\'s logs. Supports options from docker logs',

  builder(yargs) {
    return yargs.strict(false).option('tail', {
      description: 'Number of lines to show from the end of the logs',
      number: true
    }).option('follow', {
      description: 'Follow log output',
      alias: 'f',
      boolean: true
    });
  },

  handler: commandHandlers.logs
};
exports.logs = logs;
const reconfig = {
  description: 'Updates server env and start script to match config',
  handler: commandHandlers.reconfig
};
exports.reconfig = reconfig;
const restart = {
  description: 'Restart app',
  handler: commandHandlers.restart
};
exports.restart = restart;
const setup = {
  description: 'Install dependencies, custom certificates, and MongoDB on server',
  handler: commandHandlers.setup
};
exports.setup = setup;
const start = {
  description: 'Start app',
  handler: commandHandlers.start
};
exports.start = start;
const stop = {
  description: 'Stop app',
  handler: commandHandlers.stop
};
exports.stop = stop;
const ssh = {
  name: 'ssh [server]',
  description: 'SSH into server',
  handler: commandHandlers.ssh,

  builder(yargs) {
    yargs.positional('server', {
      description: 'Name of server'
    }).strict(false);
  }

};
exports.ssh = ssh;
const validate = {
  description: 'validate config',

  builder(yargs) {
    return yargs.option('show', {
      description: 'Show config after being modified by plugins',
      bool: true
    }).option('scrub', {
      description: 'Shows the config with sensitive information removed',
      bool: true
    });
  },

  handler: commandHandlers.validate
};
exports.validate = validate;
const status = {
  description: 'View status of your app, databases and other components',
  handler: commandHandlers.status,

  builder(yargs) {
    return yargs.option('overview', {
      description: 'Simplified report to quickly see the status of each component',
      bool: true
    });
  }

};
exports.status = status;
//# sourceMappingURL=commands.js.map