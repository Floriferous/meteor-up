"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _joi = _interopRequireDefault(require("@hapi/joi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const schema = _joi.default.object().keys({
  ssl: _joi.default.object().keys({
    letsEncryptEmail: _joi.default.string().trim(),
    crt: _joi.default.string().trim(),
    key: _joi.default.string().trim(),
    forceSSL: _joi.default.bool()
  }).and('crt', 'key').without('letsEncryptEmail', ['crt', 'key']).or('letsEncryptEmail', 'crt', 'forceSSL'),
  domains: _joi.default.string().required(),
  nginxServerConfig: _joi.default.string(),
  nginxLocationConfig: _joi.default.string(),
  clientUploadLimit: _joi.default.string(),
  servers: _joi.default.object(),
  loadBalancing: _joi.default.bool(),
  stickySessions: _joi.default.bool(),
  shared: _joi.default.object().keys({
    clientUploadLimit: _joi.default.alternatives().try(_joi.default.number(), _joi.default.string()),
    httpPort: _joi.default.number(),
    httpsPort: _joi.default.number(),
    nginxConfig: _joi.default.string(),
    nginxTemplate: _joi.default.string(),
    templatePath: _joi.default.string(),
    env: _joi.default.object().pattern(/[\s\S]*/, [_joi.default.string(), _joi.default.number(), _joi.default.boolean()]),
    envLetsEncrypt: _joi.default.object().keys({
      ACME_CA_URI: _joi.default.string().regex(new RegExp('^(http|https)://', 'i')),
      DEBUG: _joi.default.boolean(),
      NGINX_PROXY_CONTAINER: _joi.default.string()
    }).pattern(/[\s\S]*/, [_joi.default.string(), _joi.default.number(), _joi.default.boolean()])
  })
});

function _default(config, {
  addDepreciation,
  combineErrorDetails,
  VALIDATE_OPTIONS,
  addLocation
}) {
  let details = [];
  details = combineErrorDetails(details, _joi.default.validate(config.proxy, schema, VALIDATE_OPTIONS));

  if (config.app && config.app.env && config.app.env.PORT && config.app.env.PORT !== 80 && !config.proxy.loadBalancing) {
    details.push({
      message: 'app.env.PORT is ignored when using the reverse proxy',
      path: ''
    });
  }

  if (config.proxy.shared && config.proxy.shared.clientUploadLimit) {
    details = addDepreciation(details, 'shared.clientUploadLimit', 'Use proxy.clientUploadLimit instead', 'https://git.io/vN5tn');
  }

  if (config.swarm && config.swarm.enabled && !config.proxy.servers) {
    details.push({
      message: 'is required when using Docker Swarm',
      path: 'servers'
    });
  }

  return addLocation(details, 'proxy');
}
//# sourceMappingURL=validate.js.map