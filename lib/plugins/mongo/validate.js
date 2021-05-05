"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _joi = _interopRequireDefault(require("@hapi/joi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const schema = _joi.default.object().keys({
  // TODO: mongo.oplog and mongo.port is unused,
  // but was part of the example config.
  // decide what to do with it
  oplog: _joi.default.bool(),
  port: _joi.default.number(),
  dbName: _joi.default.string(),
  version: _joi.default.string(),
  servers: _joi.default.object().keys().required()
});

function externalMongoUrl(appConfig) {
  const result = [];

  if (!appConfig || !appConfig.env || !appConfig.env.MONGO_URL) {
    return result;
  }

  const mongoUrl = appConfig.env.MONGO_URL; // Detect IP Addresses and domain names

  const periodExists = mongoUrl.indexOf('.') > -1; // Detect username:password@domain.com

  const atExists = mongoUrl.indexOf('@') > -1;

  if (periodExists || atExists) {
    result.push({
      message: 'It looks like app.env.MONGO_URL is for an external database. Remove the `mongo` object to use external databases.',
      path: ''
    });
  }

  return result;
}

function _default(config, {
  combineErrorDetails,
  serversExist,
  addLocation,
  VALIDATE_OPTIONS
}) {
  const origionalConfig = config._origionalConfig;
  let details = [];

  const validationErrors = _joi.default.validate(config.mongo, schema, VALIDATE_OPTIONS);

  details = combineErrorDetails(details, validationErrors);
  details = combineErrorDetails(details, serversExist(config.servers, config.mongo.servers));
  details = combineErrorDetails(details, externalMongoUrl(origionalConfig.app || origionalConfig.meteor));
  return addLocation(details, 'mongo');
}
//# sourceMappingURL=validate.js.map