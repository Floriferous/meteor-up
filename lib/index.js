"use strict";

require("./node-version");

require("./nodemiral");

var _loadPlugins = _interopRequireWildcard(require("./load-plugins"));

var _chalk = _interopRequireDefault(require("chalk"));

var _updates = _interopRequireDefault(require("./updates"));

var _utils = require("./utils");

var _pluginApi = _interopRequireDefault(require("./plugin-api"));

var _package = _interopRequireDefault(require("../package.json"));

var _hooks = require("./hooks");

var _yargs = _interopRequireDefault(require("yargs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const unwantedArgvs = ['_', '$0', 'settings', 'config', 'verbose', 'show-hook-names', 'help', 'servers']; // Prevent yargs from exiting the process before plugins are loaded

_yargs.default.help(false); // Load config before creating commands


const preAPI = new _pluginApi.default(process.cwd(), process.argv, _yargs.default.argv);
const config = preAPI.getConfig(false);
let pluginList = []; // Load plugins

if (config.plugins instanceof Array) {
  const appPath = config.app && config.app.path ? config.app.path : '';
  const absoluteAppPath = preAPI.resolvePath(preAPI.base, appPath);
  pluginList = config.plugins.map(plugin => ({
    name: plugin,
    path: (0, _loadPlugins.locatePluginDir)(plugin, preAPI.configPath, absoluteAppPath)
  }));
  (0, _loadPlugins.loadPlugins)(pluginList);
} // Load hooks


if (config.hooks) {
  Object.keys(config.hooks).forEach(key => {
    (0, _hooks.registerHook)(key, config.hooks[key]);
  });
}

function commandWrapper(pluginName, commandName) {
  return function () {
    // Runs in parallel with command
    (0, _updates.default)([{
      name: _package.default.name,
      path: require.resolve('../package.json')
    }, ...pluginList]);
    const rawArgv = process.argv.slice(2);
    const filteredArgv = (0, _utils.filterArgv)(rawArgv, _yargs.default.argv, unwantedArgvs);
    const api = new _pluginApi.default(process.cwd(), filteredArgv, _yargs.default.argv);
    let potentialPromise;

    try {
      potentialPromise = api.runCommand(`${pluginName}.${commandName}`);
    } catch (e) {
      api._commandErrorHandler(e);
    }

    if (potentialPromise && typeof potentialPromise.then === 'function') {
      potentialPromise.catch(api._commandErrorHandler);
    }
  };
}

function addModuleCommands(builder, module, moduleName) {
  Object.keys(module.commands).forEach(commandName => {
    const command = module.commands[commandName];
    const name = command.name || commandName;
    command.builder = command.builder || {};
    builder.command(name, command.description.length === 0 ? false : command.description, command.builder, commandWrapper(moduleName, commandName));
  });
}

let program = _yargs.default.usage(`\nUsage: ${_chalk.default.yellow('mup')} <command> [args]`).version(_package.default.version).alias('v', 'version').global('version', false).option('settings', {
  description: 'Path to Meteor settings file',
  requiresArg: true,
  string: true
}).option('config', {
  description: 'Path to mup.js config file',
  requiresArg: true,
  string: true
}).option('servers', {
  description: 'Comma separated list of servers to use',
  requiresArg: true,
  string: true
}).option('verbose', {
  description: 'Print output from build and server scripts',
  boolean: true
}).option('show-hook-names', {
  description: 'Prints names of the available hooks as the command runs',
  boolean: true
}).strict(true).scriptName('mup').alias('h', 'help').epilogue('For more information, read the docs at http://meteor-up.com/docs.html').help('help');

Object.keys(_loadPlugins.default).forEach(moduleName => {
  if (moduleName !== 'default' && _loadPlugins.default[moduleName].commands) {
    _yargs.default.command(moduleName, _loadPlugins.default[moduleName].description, subYargs => {
      addModuleCommands(subYargs, _loadPlugins.default[moduleName], moduleName);
    }, () => {
      _yargs.default.showHelp('log');
    });
  } else if (moduleName === 'default') {
    addModuleCommands(_yargs.default, _loadPlugins.default[moduleName], moduleName);
  }
});
program = program.argv;

if (program._.length === 0) {
  _yargs.default.showHelp();
}
//# sourceMappingURL=index.js.map