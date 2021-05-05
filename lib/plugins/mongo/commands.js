"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.status = exports.shell = exports.stop = exports.start = exports.logs = exports.setup = void 0;

var commandHandlers = _interopRequireWildcard(require("./command-handlers"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const setup = {
  description: 'Installs and starts MongoDB',
  handler: commandHandlers.setup
};
exports.setup = setup;
const logs = {
  description: 'View MongoDB logs',

  builder(yargs) {
    return yargs.strict(false);
  },

  handler: commandHandlers.logs
};
exports.logs = logs;
const start = {
  description: 'Start MongoDB',
  handler: commandHandlers.start
};
exports.start = start;
const stop = {
  description: 'Stop MongoDB',
  handler: commandHandlers.stop
};
exports.stop = stop;
const shell = {
  description: 'Open MongoDB shell on the server',
  handler: commandHandlers.shell
};
exports.shell = shell;
const status = {
  description: 'View MongoDB status',
  handler: commandHandlers.status,

  builder(yargs) {
    return yargs.option('overview', {
      description: 'Simplified report to quickly see the status of mongo',
      bool: true
    });
  }

};
exports.status = status;
//# sourceMappingURL=commands.js.map