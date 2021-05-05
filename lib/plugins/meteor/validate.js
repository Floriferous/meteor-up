"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _joi = _interopRequireDefault(require("@hapi/joi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const schema = _joi.default.object().keys({
  name: _joi.default.string().min(1).required(),
  path: _joi.default.string().min(1).required(),
  port: _joi.default.number(),
  type: _joi.default.string(),
  servers: _joi.default.object().min(1).required().pattern(/[/s/S]*/, _joi.default.object().keys({
    env: _joi.default.object().pattern(/[/s/S]*/, [_joi.default.string(), _joi.default.number(), _joi.default.bool()]),
    bind: _joi.default.string(),
    settings: _joi.default.string()
  })),
  deployCheckWaitTime: _joi.default.number(),
  deployCheckPort: _joi.default.number(),
  enableUploadProgressBar: _joi.default.bool(),
  dockerImage: _joi.default.string(),
  docker: _joi.default.object().keys({
    image: _joi.default.string().trim(),
    imagePort: _joi.default.number(),
    imageFrontendServer: _joi.default.string(),
    args: _joi.default.array().items(_joi.default.string()),
    bind: _joi.default.string().trim(),
    prepareBundle: _joi.default.bool(),
    prepareBundleLocally: _joi.default.bool(),
    buildInstructions: _joi.default.array().items(_joi.default.string()),
    stopAppDuringPrepareBundle: _joi.default.bool(),
    useBuildKit: _joi.default.bool(),
    networks: _joi.default.array().items(_joi.default.string())
  }),
  buildOptions: _joi.default.object().keys({
    serverOnly: _joi.default.bool(),
    debug: _joi.default.bool(),
    cleanAfterBuild: _joi.default.bool(),
    buildLocation: _joi.default.string(),
    mobileSettings: _joi.default.object(),
    server: _joi.default.string().uri(),
    allowIncompatibleUpdates: _joi.default.boolean(),
    executable: _joi.default.string()
  }),
  env: _joi.default.object().keys({
    ROOT_URL: _joi.default.string().regex(new RegExp('^(http|https)://', 'i'), 'valid url with "http://" or "https://"').required(),
    MONGO_URL: _joi.default.string()
  }).pattern(/[\s\S]*/, [_joi.default.string(), _joi.default.number(), _joi.default.bool()]),
  log: _joi.default.object().keys({
    driver: _joi.default.string(),
    opts: _joi.default.object()
  }),
  volumes: _joi.default.object(),
  nginx: _joi.default.object().keys({
    clientUploadLimit: _joi.default.string().trim()
  }),
  ssl: _joi.default.object().keys({
    autogenerate: _joi.default.object().keys({
      email: _joi.default.string().email().required(),
      domains: _joi.default.string().required()
    }),
    crt: _joi.default.string().trim(),
    key: _joi.default.string().trim(),
    port: _joi.default.number(),
    upload: _joi.default.boolean()
  }).and('crt', 'key').without('autogenerate', ['crt', 'key']).or('crt', 'autogenerate')
});

function _default(config, {
  addDepreciation,
  combineErrorDetails,
  VALIDATE_OPTIONS,
  serversExist,
  addLocation
}) {
  let details = [];
  details = combineErrorDetails(details, _joi.default.validate(config.app, schema, VALIDATE_OPTIONS));

  if (config.app.name && config.app.name.indexOf(' ') > -1) {
    details.push({
      message: 'has a space',
      path: 'name'
    });
  }

  if (typeof config.app.ssl === 'object' && 'autogenerate' in config.app.ssl && 'PORT' in config.app.env) {
    details.push({
      message: 'PORT can not be set when using ssl.autogenerate',
      path: 'env'
    });
  }

  details = combineErrorDetails(details, serversExist(config.servers, config.app.servers)); // Depreciations

  if (config.app.ssl) {
    details = addDepreciation(details, 'ssl', 'Use the reverse proxy instead', 'https://git.io/vN5tn');
  }

  if (config.app.nginx) {
    details = addDepreciation(details, 'nginx', 'Use the reverse proxy instead', 'https://git.io/vN5tn');
  }

  if (config.app.docker && config.app.docker.imageFrontendServer) {
    details = addDepreciation(details, 'docker.imageFrontendServer', 'Use the reverse proxy instead', 'https://git.io/vN5tn');
  }

  return addLocation(details, config.meteor ? 'meteor' : 'app');
}
//# sourceMappingURL=validate.js.map