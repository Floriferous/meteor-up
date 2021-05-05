"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareConfig = prepareConfig;
exports.scrubConfig = scrubConfig;
exports.swarmOptions = swarmOptions;
exports.hooks = exports.validate = exports.commands = exports.description = void 0;

var _commands = _interopRequireWildcard(require("./commands"));

var _validate = _interopRequireDefault(require("./validate"));

var _lodash = require("lodash");

var _traverse = _interopRequireDefault(require("traverse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const description = 'Deploy and manage meteor apps';
exports.description = description;
const commands = _commands;
exports.commands = commands;
const validate = {
  meteor: _validate.default,

  app(config, utils) {
    if (typeof config.meteor === 'object' || config.app && config.app.type !== 'meteor') {
      // The meteor validator will check the config
      // Or the config is telling a different plugin to handle deployment
      return [];
    }

    return (0, _validate.default)(config, utils);
  }

};
exports.validate = validate;

function prepareConfig(config) {
  if (!config.app || config.app.type !== 'meteor') {
    return config;
  }

  config.app.docker = (0, _lodash.defaultsDeep)(config.app.docker, {
    image: config.app.dockerImage || 'kadirahq/meteord',
    stopAppDuringPrepareBundle: true
  });
  delete config.app.dockerImage; // If imagePort is not set, use port 3000 to simplify using
  // images that run the app with a non-root user.
  // Port 80 was the traditional port used by kadirahq/meteord
  // and meteorhacks/meteord, but they allow the PORT env
  // variable to override it.

  config.app.docker.imagePort = config.app.docker.imagePort || 3000;
  return config;
}

function meteorEnabled(api) {
  const config = api.getConfig();
  return config.app && config.app.type === 'meteor';
}

function onlyMeteorEnabled(...commandNames) {
  return function (api) {
    let index = 0;

    function thenHandler() {
      index += 1;

      if (commandNames.length > index) {
        return api.runCommand(commandNames[index]).then(thenHandler);
      }
    }

    if (meteorEnabled(api)) {
      return api.runCommand(commandNames[index]).then(thenHandler);
    }
  };
}

const hooks = {
  'post.default.setup': onlyMeteorEnabled('meteor.setup'),
  'post.default.deploy': onlyMeteorEnabled('meteor.deploy'),
  'post.default.start': onlyMeteorEnabled('meteor.start'),
  'post.default.stop': onlyMeteorEnabled('meteor.stop'),
  'post.default.logs': onlyMeteorEnabled('meteor.logs'),
  'post.default.reconfig': onlyMeteorEnabled('meteor.envconfig', 'meteor.start'),
  'post.default.restart': onlyMeteorEnabled('meteor.restart'),
  'post.default.status': onlyMeteorEnabled('meteor.status')
};
exports.hooks = hooks;

function scrubConfig(config, utils) {
  if (config.meteor) {
    delete config.meteor;
  }

  if (config.app) {
    // eslint-disable-next-line
    config.app = (0, _traverse.default)(config.app).map(function () {
      const path = this.path.join('.');

      switch (path) {
        case 'name':
          return this.update('my-app');

        case 'buildOptions.server':
          return this.update(utils.scrubUrl(this.node));

        case 'env.ROOT_URL':
          return this.update(utils.scrubUrl(this.node));

        case 'env.MONGO_URL':
          if (config.mongo) {
            const url = this.node.split('/');
            url.pop();
            url.push('my-app');
            return this.update(url.join('/'));
          }

          return this.update(utils.scrubUrl(this.node));
        // no default
      }
    });
  }

  return config;
}

function swarmOptions(config) {
  if (config && config.app && config.app.type === 'meteor') {
    const label = {
      name: `mup-app-${config.app.name}`,
      value: 'true',
      servers: Object.keys(config.app.servers)
    };
    return {
      labels: [label]
    };
  }
}
//# sourceMappingURL=index.js.map