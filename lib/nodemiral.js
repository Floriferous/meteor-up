"use strict";

var _lodash = require("lodash");

var _nodemiral = _interopRequireDefault(require("@zodern/nodemiral"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function copy(session, _options, callback) {
  const options = (0, _lodash.clone)(_options);
  let retries = 0;

  if (typeof options.hostVars === 'object' && options.hostVars[session._host]) {
    options.vars = (0, _lodash.merge)(options.vars, options.hostVars[session._host]);
  }

  function doCopy() {
    session.copy(options.src, options.dest, options, cb);
  }

  function cb(err) {
    // Check if common error that a known fix
    if (err) {
      if (err.message === 'No such file') {
        err.solution = 'Please run "mup setup" to create missing folders on the server.'; // Skip retries since we will have the same error

        retries = 10;
      }
    }

    retries += 1;

    if (err && retries < 4) {
      const timeout = retries * 3000;
      console.log('Failed to copy file ', err.message);
      console.log(`Retrying in ${timeout / 1000} seconds`);
      setTimeout(doCopy, timeout);
      return;
    }

    callback(err);
  }

  doCopy();
}

function executeScript(session, _options, callback, varsMapper) {
  const options = (0, _lodash.clone)(_options);

  if (typeof options.hostVars === 'object' && options.hostVars[session._host]) {
    options.vars = (0, _lodash.merge)(options.vars, options.hostVars[session._host]);
  }

  session.executeScript(options.script, options, createCallback(callback, varsMapper));
}

function createCallback(cb, varsMapper) {
  return function (err, code, logs = {}) {
    logs.stderr = logs.stderr || '';
    logs.stdout = logs.stdout || '';

    if (err) {
      return cb(err);
    }

    if (code > 0) {
      const message = `
      ------------------------------------STDERR------------------------------------
      ${logs.stderr.substring(logs.stderr.length - 4200)}
      ------------------------------------STDOUT------------------------------------
      ${logs.stdout.substring(logs.stdout.length - 4200)}
      ------------------------------------------------------------------------------
      `;
      return cb(new Error(message));
    }

    if (varsMapper) {
      varsMapper(logs.stdout, logs.stderr);
    }

    cb();
  };
}

_nodemiral.default.registerTask('copy', copy);

_nodemiral.default.registerTask('executeScript', executeScript);

const oldApplyTemplate = _nodemiral.default.session.prototype._applyTemplate; // Adds support for using include with ejs

_nodemiral.default.session.prototype._applyTemplate = function (file, vars, callback) {
  const ejsOptions = this._options.ejs || {};
  this._options.ejs = _objectSpread(_objectSpread({}, ejsOptions), {}, {
    filename: file
  });
  oldApplyTemplate.call(this, file, vars, (...args) => {
    this._options.ejs = ejsOptions;
    callback(...args);
  });
};
//# sourceMappingURL=nodemiral.js.map