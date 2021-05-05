"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.envconfig = exports.push = exports.build = exports.debug = exports.status = exports.restart = exports.stop = exports.start = exports.logs = exports.destroy = exports.deploy = exports.setup = void 0;

var commandHandlers = _interopRequireWildcard(require("./command-handlers"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const setup = {
  description: 'Prepare server to deploy meteor apps',
  handler: commandHandlers.setup
};
exports.setup = setup;
const deploy = {
  description: 'Deploy meteor apps',

  builder(subYargs) {
    return subYargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },

  handler: commandHandlers.deploy
};
exports.deploy = deploy;
const destroy = {
  description: 'Stop and completely remove app from server',
  handler: commandHandlers.destroy,

  builder(subYargs) {
    return subYargs.option('force', {
      description: 'forces app to be removed',
      boolean: true
    });
  }

};
exports.destroy = destroy;
const logs = {
  description: 'View meteor app\'s logs',

  builder(yargs) {
    return yargs.strict(false).option('tail', {
      description: 'Number of lines to show from the end of the logs',
      alias: 't',
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
const start = {
  description: 'Start meteor app',
  handler: commandHandlers.start
};
exports.start = start;
const stop = {
  description: 'Stop meteor app',
  handler: commandHandlers.stop
};
exports.stop = stop;
const restart = {
  description: 'Restart meteor app',
  handler: commandHandlers.restart
};
exports.restart = restart;
const status = {
  description: 'View the app\'s status',
  handler: commandHandlers.status,

  builder(yargs) {
    return yargs.option('overview', {
      description: 'Simplified report to quickly see the status of each component',
      bool: true
    });
  }

};
exports.status = status;
const debug = {
  name: 'debug [server]',
  description: 'Debug the meteor app',

  builder(yargs) {
    yargs.strict(false);
  },

  handler: commandHandlers.debugApp
}; // Hidden commands

exports.debug = debug;
const build = {
  description: false,

  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },

  handler: commandHandlers.build
};
exports.build = build;
const push = {
  description: false,

  builder(yargs) {
    return yargs.option('cached-build', {
      description: 'Use build from previous deploy',
      boolean: true
    });
  },

  handler: commandHandlers.push
};
exports.push = push;
const envconfig = {
  description: false,
  handler: commandHandlers.envconfig
};
exports.envconfig = envconfig;
//# sourceMappingURL=commands.js.map