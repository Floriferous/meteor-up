"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareConfig = prepareConfig;
exports.hooks = exports.validate = exports.commands = exports.description = void 0;

var _commands = _interopRequireWildcard(require("./commands"));

var _validate = _interopRequireDefault(require("./validate"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const description = 'Commands to manage MongoDB';
exports.description = description;
const commands = _commands;
exports.commands = commands;
const validate = {
  mongo: _validate.default
};
exports.validate = validate;

function prepareConfig(config) {
  if (!config.app || !config.mongo) {
    return config;
  }

  config.mongo.version = config.mongo.version || '3.4.1';
  config.app.env = config.app.env || {};
  config.mongo.dbName = config.mongo.dbName || config.app.name.split('.').join('');
  config.app.env.MONGO_URL = `mongodb://mongodb:27017/${config.mongo.dbName}`;

  if (!config.app.docker) {
    config.app.docker = {};
  }

  if (!config.app.docker.args) {
    config.app.docker.args = [];
  }

  config.app.docker.args.push('--link=mongodb:mongodb');
  return config;
}

const hooks = {
  'post.default.setup'(api) {
    const config = api.getConfig();

    if (config.mongo) {
      return api.runCommand('mongo.setup').then(() => api.runCommand('mongo.start'));
    }
  },

  'post.default.status'(api) {
    const config = api.getConfig();

    if (config.mongo) {
      return api.runCommand('mongo.status');
    }
  }

};
exports.hooks = hooks;
//# sourceMappingURL=index.js.map