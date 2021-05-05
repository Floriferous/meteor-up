"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareConfig = prepareConfig;
exports.scrubConfig = scrubConfig;
exports.swarmOptions = swarmOptions;
exports.hooks = exports.validate = exports.commands = exports.description = void 0;

var _commands = _interopRequireWildcard(require("./commands"));

var _utils = require("./utils");

var _commandHandlers = require("./command-handlers");

var _validate = _interopRequireDefault(require("./validate"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const description = 'Setup and manage reverse proxy and ssl';
exports.description = description;
const commands = _commands;
exports.commands = commands;
const validate = {
  proxy: _validate.default
}; // eslint-disable-next-line complexity

exports.validate = validate;

function prepareConfig(config) {
  if (!config.app || !config.proxy) {
    return config;
  }

  const swarmEnabled = config.swarm && config.swarm.enabled;
  config.app.env = config.app.env || {};
  config.app.docker = config.app.docker || {};
  config.app.env = (0, _utils.addProxyEnv)(config, config.app.env);

  if (config.app.servers && config.proxy.loadBalancing) {
    Object.keys(config.app.servers).forEach(key => {
      const privateIp = config.servers[key].privateIp;

      if (privateIp) {
        config.app.servers[key].bind = privateIp;
      }
    });
  }

  if (!swarmEnabled) {
    config.app.env.VIRTUAL_PORT = config.app.docker.imagePort || 3000;
  }

  config.app.env.HTTP_FORWARDED_COUNT = config.app.env.HTTP_FORWARDED_COUNT || 1;

  if (swarmEnabled) {
    config.app.docker.networks = config.app.docker.networks || [];
    config.app.docker.networks.push('mup-proxy');
  }

  config.app.env.ROOT_URL = (0, _utils.normalizeUrl)(config, config.app.env);
  return config;
} // eslint-disable-next-line complexity


function scrubConfig(config, {
  scrubUrl
}) {
  if (!config.proxy) {
    return config;
  }

  function scrubDomains(domains) {
    return domains.split(',').map(domain => // We temporarily add a protocol so it can be parsed as a url
    scrubUrl(`http://${domain.trim()}`).slice(7)).join(',');
  }

  if (config.app && config.app.env) {
    const {
      LETSENCRYPT_EMAIL,
      VIRTUAL_HOST,
      LETSENCRYPT_HOST
    } = config.app.env;

    if (LETSENCRYPT_EMAIL) {
      config.app.env.LETSENCRYPT_EMAIL = 'email@domain.com';
    }

    if (LETSENCRYPT_HOST) {
      config.app.env.LETSENCRYPT_HOST = scrubDomains(LETSENCRYPT_HOST);
    }

    if (VIRTUAL_HOST) {
      config.app.env.VIRTUAL_HOST = scrubDomains(VIRTUAL_HOST);
    }
  }

  if (config.proxy) {
    const {
      shared,
      ssl,
      domains
    } = config.proxy;

    if (ssl && ssl.letsEncryptEmail) {
      config.proxy.ssl.letsEncryptEmail = 'email@domain.com';
    }

    if (domains) {
      config.proxy.domains = scrubDomains(domains);
    }

    if (shared && shared.env && shared.env.DEFAULT_HOST) {
      shared.env.DEFAULT_HOST = scrubDomains(shared.env.DEFAULT_HOST);
    }
  }

  return config;
} // This hook runs when setting up the proxy or running mup reconfig
// This creates a small container for the proxy to know about the service


function configureServiceHook(api) {
  const config = api.getConfig();

  if (config.proxy && (api.swarmEnabled() || config.proxy.loadBalancing)) {
    return (0, _commandHandlers.updateProxyForLoadBalancing)(api);
  }
}

const hooks = {
  'post.default.status'(api) {
    if (api.getConfig().proxy) {
      api.runCommand('proxy.status');
    }
  },

  'post.setup'(api) {
    if (api.getConfig().proxy) {
      return api.runCommand('proxy.setup');
    }
  },

  'post.reconfig': configureServiceHook,
  'post.proxy.setup': configureServiceHook
};
exports.hooks = hooks;

function swarmOptions(config) {
  if (config && config.proxy) {
    return {
      managers: Object.keys(config.proxy.servers)
    };
  }
}
//# sourceMappingURL=index.js.map