"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateSwarm = validateSwarm;
exports.validateRegistry = validateRegistry;

var _joi = _interopRequireDefault(require("@hapi/joi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const swarmSchema = _joi.default.object().keys({
  enabled: _joi.default.bool().required(),
  labels: _joi.default.array().items(_joi.default.object().keys({
    name: _joi.default.string().required(),
    value: _joi.default.string().required(),
    servers: _joi.default.array().items(_joi.default.string())
  }))
});

const registrySchema = _joi.default.object().keys({
  host: _joi.default.string().required(),
  imagePrefix: _joi.default.string(),
  username: _joi.default.string(),
  password: _joi.default.string()
});

function validateSwarm(config, {
  addLocation,
  VALIDATE_OPTIONS,
  combineErrorDetails
}) {
  let details = [];
  details = combineErrorDetails(details, _joi.default.validate(config.swarm, swarmSchema, VALIDATE_OPTIONS));
  return addLocation(details, 'swarm');
}

function validateRegistry(config, {
  addLocation,
  VALIDATE_OPTIONS,
  combineErrorDetails
}) {
  let details = [];
  details = combineErrorDetails(details, _joi.default.validate(config.privateDockerRegistry, registrySchema, VALIDATE_OPTIONS));
  return addLocation(details, 'dockerPrivateRegistry');
}
//# sourceMappingURL=validate.js.map