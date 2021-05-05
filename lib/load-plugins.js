"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.locatePluginDir = locatePluginDir;
exports.loadPlugins = loadPlugins;
exports.default = void 0;

var _path = require("path");

var _utils = require("./utils");

var _validate = require("./validate");

var _chalk = _interopRequireDefault(require("chalk"));

var _debug = _interopRequireDefault(require("debug"));

var _fs = _interopRequireDefault(require("fs"));

var _globalModules = _interopRequireDefault(require("global-modules"));

var _commands = _interopRequireDefault(require("./commands"));

var _hooks = require("./hooks");

var _prepareConfig = require("./prepare-config");

var _scrubConfig = require("./scrub-config");

var _swarmOptions = require("./swarm-options");

var _resolveFrom = _interopRequireDefault(require("resolve-from"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)('mup:plugin-loader');
const modules = {};
var _default = modules; // Load all folders in ./plugins as mup plugins.
// The directory name is the module name.

exports.default = _default;

const bundledPlugins = _fs.default.readdirSync((0, _path.resolve)(__dirname, 'plugins')).map(name => ({
  name,
  path: `./plugins/${name}`
})).filter(isDirectoryMupPlugin);

loadPlugins(bundledPlugins);

function locatePluginDir(name, configPath, appPath) {
  log(`loading plugin ${name}`);

  if (name.indexOf('.') === 0 || name.indexOf('/') === 0 || name.indexOf('~') === 0) {
    log('plugin name is a path to the plugin');
    return (0, _utils.resolvePath)(configPath, '../', name);
  }

  const configLocalPath = _resolveFrom.default.silent(configPath, name);

  if (configLocalPath) {
    log('plugin installed locally to config folder');
    return configLocalPath;
  }

  try {
    const mupLocal = require.resolve(name);

    log('plugin installed locally with mup');
    return mupLocal;
  } catch (e) {// Continues to next location to resolve from
  }

  const appLocalPath = _resolveFrom.default.silent(appPath, name);

  if (appLocalPath) {
    log('plugin installed locall in app folder');
    return appLocalPath;
  }

  log(`global install path: ${_globalModules.default}`);

  const globalPath = _resolveFrom.default.silent((0, _path.resolve)(_globalModules.default, '..'), name);

  if (globalPath) {
    log('plugin installed globally');
    return globalPath;
  }

  log('plugin not found');
  return name;
}

function registerPlugin(plugin) {
  if (plugin.module.commands) {
    Object.keys(plugin.module.commands).forEach(key => {
      (0, _commands.default)(plugin.name, key, plugin.module.commands[key]);
    });
  }

  if (plugin.module.hooks) {
    Object.keys(plugin.module.hooks).forEach(key => {
      (0, _hooks.registerHook)(key, plugin.module.hooks[key]);
    });
  }

  if (typeof plugin.module.validate === 'object') {
    const validators = Object.entries(plugin.module.validate);

    for (const [property, validator] of validators) {
      (0, _validate.addPluginValidator)(property, validator);
    }
  }

  if (plugin.module.prepareConfig) {
    (0, _prepareConfig.registerPreparer)(plugin.module.prepareConfig);
  }

  if (plugin.module.scrubConfig) {
    (0, _scrubConfig.registerScrubber)(plugin.module.scrubConfig);
  }

  if (plugin.module.swarmOptions) {
    (0, _swarmOptions.registerSwarmOptions)(plugin.module.swarmOptions);
  }
}

function loadPlugins(plugins) {
  plugins.map(plugin => {
    try {
      // eslint-disable-next-line global-require
      const module = require(plugin.path);

      const name = module.name || plugin.name;
      return {
        name,
        module
      };
    } catch (e) {
      console.log(_chalk.default.red(`Unable to load plugin ${plugin.name}`)); // Hides error when plugin cannot be loaded
      // Show the error when a plugin cannot resolve a module

      if (e.code !== 'MODULE_NOT_FOUND' || !(0, _utils.moduleNotFoundIsPath)(e, plugin.path)) {
        console.log(e);
      }

      return {
        name: module.name || plugin.name,
        failed: true
      };
    }
  }).filter(plugin => !plugin.failed).forEach(plugin => {
    modules[plugin.name] = plugin.module;
    registerPlugin(plugin);
  });
}

function isDirectoryMupPlugin({
  name,
  path: modulePath
}) {
  if (name === '__tests__') {
    return false;
  }

  const moduleDir = (0, _path.join)(__dirname, modulePath);
  return _fs.default.statSync(moduleDir).isDirectory();
}
//# sourceMappingURL=load-plugins.js.map