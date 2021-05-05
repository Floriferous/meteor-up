"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerScrubber = registerScrubber;
exports.scrubConfig = scrubConfig;
exports.utils = exports._configScrubbers = void 0;

var _lodash = require("lodash");

var _url = require("url");

const _configScrubbers = [];
exports._configScrubbers = _configScrubbers;

function registerScrubber(scrubber) {
  _configScrubbers.push(scrubber);
}

const utils = {
  scrubUrl(url) {
    const {
      protocol,
      auth,
      hostname,
      port,
      path,
      hash
    } = (0, _url.parse)(url);
    let href = `${protocol}//`;

    if (auth) {
      href += 'user:pass@';
    }

    const domains = hostname.split('.');
    domains.pop();
    domains.pop();
    domains.forEach(() => {
      href += 'subdomain.';
    });
    href += 'host.com';

    if (port) {
      href += `:${port}`;
    }

    if (path && path !== '/') {
      href += path;
    }

    if (hash) {
      href += hash;
    }

    return href;
  }

};
exports.utils = utils;

function scrubConfig(_config) {
  let config = (0, _lodash.cloneDeep)(_config);

  _configScrubbers.forEach(scrubber => {
    config = scrubber(config, utils);
  });

  return config;
}
//# sourceMappingURL=scrub-config.js.map