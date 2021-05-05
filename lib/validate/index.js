"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addPluginValidator = addPluginValidator;
exports.default = validate;
exports.showErrors = showErrors;
exports.showDepreciations = showDepreciations;
exports._pluginValidators = void 0;

var utils = _interopRequireWildcard(require("./utils"));

var _chalk = _interopRequireDefault(require("chalk"));

var _joi = _interopRequireDefault(require("@hapi/joi"));

var _servers = _interopRequireDefault(require("./servers"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  combineErrorDetails,
  VALIDATE_OPTIONS,
  improveErrors
} = utils;
const _pluginValidators = {};
exports._pluginValidators = _pluginValidators;

function addPluginValidator(rootPath, handler) {
  _pluginValidators[rootPath] = _pluginValidators[rootPath] || [];

  _pluginValidators[rootPath].push(handler);
}

function generateSchema() {
  const topLevelKeys = {
    servers: _joi.default.object(),
    app: _joi.default.object(),
    plugins: _joi.default.array(),
    _origionalConfig: _joi.default.object(),
    hooks: _joi.default.object().pattern(/.*/, _joi.default.alternatives(_joi.default.object({
      localCommand: _joi.default.string(),
      remoteCommand: _joi.default.string(),
      method: _joi.default.func()
    }), _joi.default.func()))
  };
  Object.keys(_pluginValidators).forEach(key => {
    topLevelKeys[key] = _joi.default.any();
  });
  return _joi.default.object().keys(topLevelKeys);
}

function validateAll(_config, origionalConfig) {
  let details = [];
  let results; // TODO: the config object created by the plugin api
  // should always have this property.

  const config = _objectSpread(_objectSpread({}, _config), {}, {
    _origionalConfig: origionalConfig
  });

  results = _joi.default.validate(config, generateSchema(), VALIDATE_OPTIONS);
  details = combineErrorDetails(details, results);

  if (config.servers) {
    results = (0, _servers.default)(config.servers);
    details = combineErrorDetails(details, results);
  }

  for (const [property, validators] of Object.entries(_pluginValidators)) {
    if (config[property] !== undefined) {
      // eslint-disable-next-line no-loop-func
      validators.forEach(validator => {
        results = validator(config, utils);
        details = combineErrorDetails(details, results);
      });
    }
  }

  return details.map(improveErrors);
}

function validate(config, origionalConfig) {
  const errors = [];
  const depreciations = [];
  validateAll(config, origionalConfig).forEach(problem => {
    if (problem.type === 'depreciation') {
      depreciations.push(problem);
    } else {
      errors.push(problem);
    }
  });
  return {
    errors: errors.map(error => error.message),
    depreciations: depreciations.map(depreciation => depreciation.message)
  };
}

function showErrors(errors) {
  const lines = [];
  const plural = errors.length > 1 ? 's' : '';
  lines.push(`${errors.length} Validation Error${plural}`);
  errors.forEach(error => {
    lines.push(`  - ${error}`);
  });
  lines.push('');
  console.log(_chalk.default.red(lines.join('\n')));
}

function showDepreciations(depreciations) {
  const lines = [];
  const plural = depreciations.length > 1 ? 's' : '';
  lines.push(`${depreciations.length} Depreciation${plural}`);
  depreciations.forEach(depreciation => {
    lines.push(`  - ${depreciation}`);
  });
  lines.push('');
  console.log(_chalk.default.yellow(lines.join('\n')));
}
//# sourceMappingURL=index.js.map