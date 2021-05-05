"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validateServers;

var _utils = require("./utils");

var _joi = _interopRequireDefault(require("@hapi/joi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The regexp used matches everything
const schema = _joi.default.object().keys().pattern(/.*/, {
  host: _joi.default.alternatives(_joi.default.string().trim()).required(),
  username: _joi.default.string().required(),
  pem: _joi.default.string().trim(),
  password: _joi.default.string(),
  opts: _joi.default.object().keys({
    port: _joi.default.number()
  }),
  privateIp: _joi.default.string()
});

function validateServers(servers) {
  let details = [];

  const result = _joi.default.validate(servers, schema, _utils.VALIDATE_OPTIONS);

  details = (0, _utils.combineErrorDetails)(details, result);
  Object.keys(servers).forEach(key => {
    const server = servers[key];

    if (server.pem && server.pem.indexOf('.pub') === server.pem.length - 4) {
      details.push({
        message: 'Needs to be a path to a private key. The file extension ".pub" is used for public keys.',
        path: `${key}.pem`
      });
    }
  });
  return (0, _utils.addLocation)(details, 'servers');
}
//# sourceMappingURL=servers.js.map