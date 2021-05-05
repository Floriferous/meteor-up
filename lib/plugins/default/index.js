"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scrubConfig = scrubConfig;
exports.commands = void 0;

var _commands = _interopRequireWildcard(require("./commands"));

var _traverse = _interopRequireDefault(require("traverse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const commands = _commands;
exports.commands = commands;

function scrubConfig(config) {
  if (config.servers) {
    // eslint-disable-next-line
    config.servers = (0, _traverse.default)(config.servers).map(function () {
      if (this.path.length !== 2) {
        // eslint-disable-next-line
        return;
      }

      switch (this.key) {
        case 'host':
          return this.update('1.2.3.4');

        case 'password':
          return this.update('password');

        case 'pem':
          return this.update('~/.ssh/pem');
        // no default
      }
    });
  }

  return config;
}
//# sourceMappingURL=index.js.map