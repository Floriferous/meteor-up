"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var swarmUtils = _interopRequireWildcard(require("./swarm-utils"));

var tasks = _interopRequireWildcard(require("./tasks"));

var utils = _interopRequireWildcard(require("./utils"));

var _index = _interopRequireWildcard(require("./validate/index"));

var _hooks = require("./hooks");

var _status = require("./status");

var _chalk = _interopRequireDefault(require("chalk"));

var _child_process = _interopRequireDefault(require("child_process"));

var _lodash = require("lodash");

var _commands = require("./commands");

var _debug = _interopRequireDefault(require("debug"));

var _fs = _interopRequireDefault(require("fs"));

var _swarmOptions = require("./swarm-options");

var _nodemiral = _interopRequireDefault(require("@zodern/nodemiral"));

var _parseJson = _interopRequireDefault(require("parse-json"));

var _path = _interopRequireDefault(require("path"));

var _prepareConfig = require("./prepare-config");

var _scrubConfig = require("./scrub-config");

var _serverInfo = _interopRequireDefault(require("./server-info"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  resolvePath,
  moduleNotFoundIsPath
} = utils;
const log = (0, _debug.default)('mup:api');

class PluginAPI {
  constructor(base, filteredArgs, program) {
    _defineProperty(this, "_runHooks", async function (handlers, hookName) {
      const messagePrefix = `> Running hook ${hookName}`;

      for (const hookHandler of handlers) {
        if (hookHandler.localCommand) {
          console.log(`${messagePrefix} "${hookHandler.localCommand}"`);

          this._runHookScript(hookHandler.localCommand);
        }

        if (typeof hookHandler.method === 'function') {
          try {
            await hookHandler.method(this, _nodemiral.default);
          } catch (e) {
            this._commandErrorHandler(e);
          }
        }

        if (hookHandler.remoteCommand) {
          console.log(`${messagePrefix} remote command "${hookHandler.remoteCommand}"`);
          await (0, _hooks.runRemoteHooks)(this.getConfig().servers, hookHandler.remoteCommand);
        }
      }
    });

    _defineProperty(this, "_runPreHooks", async function (name) {
      const hookName = `pre.${name}`;

      if (this.program['show-hook-names']) {
        console.log(_chalk.default.yellow(`Hook: ${hookName}`));
      }

      if (hookName in _hooks.hooks) {
        const hookList = _hooks.hooks[hookName];
        await this._runHooks(hookList, name);
      }
    });

    _defineProperty(this, "_runPostHooks", async function (commandName) {
      const hookName = `post.${commandName}`;

      if (this.program['show-hook-names']) {
        console.log(_chalk.default.yellow(`Hook: ${hookName}`));
      }

      if (hookName in _hooks.hooks) {
        const hookList = _hooks.hooks[hookName];
        await this._runHooks(hookList, hookName);
      }
    });

    _defineProperty(this, "runCommand", async function (name) {
      const firstCommand = this.commandHistory.length === 0;

      if (!name) {
        throw new Error('Command name is required');
      }

      if (!(name in _commands.commands)) {
        throw new Error(`Unknown command name: ${name}`);
      }

      this.commandHistory.push({
        name
      });
      await this._runPreHooks(name);

      try {
        log('Running command', name);
        await _commands.commands[name].handler(this, _nodemiral.default);
      } catch (e) {
        this._commandErrorHandler(e);
      }

      await this._runPostHooks(name).then(() => {
        // The post hooks for the first command should be the last thing run
        if (firstCommand) {
          this._cleanupSessions();
        }
      });
    });

    this.base = program.config ? _path.default.dirname(program.config) : base;
    this.args = filteredArgs;
    this._origionalConfig = null;
    this.config = null;
    this.settings = null;
    this.sessions = null;
    this._enabledSessions = program.servers ? program.servers.split(' ') : [];
    this.configPath = program.config ? resolvePath(program.config) : _path.default.join(this.base, 'mup.js');
    this.settingsPath = program.settings;
    this.verbose = program.verbose;
    this.program = program;
    this.commandHistory = [];
    this.profileTasks = process.env.MUP_PROFILE_TASKS === 'true';
    this.validationErrors = [];
    this.resolvePath = utils.resolvePath;
    this.getDockerLogs = utils.getDockerLogs;
    this.runSSHCommand = utils.runSSHCommand;
    this.forwardPort = utils.forwardPort;
    this._createSSHOptions = utils.createSSHOptions;
    this.statusHelpers = {
      StatusDisplay: _status.StatusDisplay,
      parseDockerInfo: _status.parseDockerInfo
    };
    this.tasks = tasks;
  }

  getArgs() {
    return this.args;
  }

  getBasePath() {
    return this.base;
  }

  getVerbose() {
    return this.verbose;
  }

  getOptions() {
    return this.program;
  }

  hasMeteorPackage(name) {
    // Check if app is using the package
    try {
      const contents = _fs.default.readFileSync(resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions')).toString(); // Looks for "package-name@" in the beginning of a
      // line or at the start of the file


      const regex = new RegExp(`(^|\\s)${name}@`, 'm');
      return regex.test(contents);
    } catch (e) {
      console.log(`Unable to load file ${resolvePath(this.getBasePath(), this.getConfig().meteor.path, '.meteor/versions')}`);
      return false;
    }
  }

  runTaskList(list, sessions, opts = {}) {
    if (!('verbose' in opts)) {
      opts.verbose = this.verbose;
    }

    if (!('showDuration' in opts)) {
      opts.showDuration = this.profileTasks;
    }

    return utils.runTaskList(list, sessions, opts);
  }

  validateConfig(configPath, logProblems) {
    // Only print errors once.
    if (this.validationErrors.length > 0) {
      return this.validationErrors;
    }

    const config = this.getConfig();
    const {
      errors,
      depreciations
    } = (0, _index.default)(config, this._origionalConfig);
    const problems = [...errors, ...depreciations];

    if (problems.length > 0 && logProblems) {
      console.log(`loaded config from ${configPath}`);
      console.log('');

      if (errors.length) {
        (0, _index.showErrors)(errors);
      }

      if (depreciations.length) {
        (0, _index.showDepreciations)(depreciations);
      }

      console.log('Read the docs and view example configs at');
      console.log('    http://meteor-up.com/docs');
      console.log('');
    }

    this.validationErrors = problems;
    return problems;
  }

  _normalizeConfig(config) {
    if (typeof config !== 'object') {
      return config;
    }

    if (config.meteor && typeof config.app !== 'object') {
      config.app = Object.assign({}, config.meteor);
      config.app.type = 'meteor';
    } else if (typeof config.app === 'object' && !('type' in config.app)) {
      config.app.type = 'meteor';
    }

    return (0, _prepareConfig.runConfigPreps)(config);
  }

  getConfig(validate = true) {
    if (!this.config) {
      try {
        delete require.cache[require.resolve(this.configPath)]; // eslint-disable-next-line global-require

        this.config = require(this.configPath);
        this._origionalConfig = (0, _lodash.cloneDeep)(this.config);
      } catch (e) {
        if (!validate) {
          return {};
        }

        if (e.code === 'MODULE_NOT_FOUND' && moduleNotFoundIsPath(e, this.configPath)) {
          console.error('"mup.js" file not found at');
          console.error(`  ${this.configPath}`);
          console.error('Run "mup init" to create it.');
        } else {
          console.error(_chalk.default.red('Error loading config file:'));
          console.error(e);
        }

        process.exit(1);
      }

      this.config = this._normalizeConfig(this.config);
      this.validateConfig(this.configPath, validate);
    }

    return this.config;
  }

  scrubConfig() {
    const config = this.getConfig();
    return (0, _scrubConfig.scrubConfig)(config);
  }

  getSettings() {
    if (!this.settings) {
      let filePath;

      if (this.settingsPath) {
        filePath = resolvePath(this.settingsPath);
      } else {
        filePath = _path.default.join(this.base, 'settings.json');
      }

      this.settings = this.getSettingsFromPath(filePath);
    }

    return this.settings;
  }

  getSettingsFromPath(settingsPath) {
    const filePath = resolvePath(settingsPath);
    let settings;

    try {
      settings = _fs.default.readFileSync(filePath).toString();
    } catch (e) {
      console.log(`Unable to load settings.json at ${filePath}`);

      if (e.code !== 'ENOENT') {
        console.log(e);
      } else {
        ['It does not exist.', '', 'You can create the file with "mup init" or add the option', '"--settings path/to/settings.json" to load it from a', 'different location.'].forEach(text => console.log(text));
      }

      process.exit(1);
    }

    try {
      settings = (0, _parseJson.default)(settings);
    } catch (e) {
      console.log('Error parsing settings file:');
      console.log(e.message);
      process.exit(1);
    }

    return settings;
  }

  setConfig(newConfig) {
    this.config = newConfig;
  }

  _runHookScript(script) {
    try {
      _child_process.default.execSync(script, {
        cwd: this.getBasePath(),
        stdio: 'inherit'
      });
    } catch (e) {
      console.log('Hook failed.');
      process.exit(1);
    }
  }

  _commandErrorHandler(e) {
    log('_commandErrorHandler');
    process.exitCode = 1; // Only show error when not from nodemiral
    // since nodemiral would have already shown the error

    if (!(e.nodemiralHistory instanceof Array)) {
      log('_commandErrorHandler: nodemiral error');
      console.error(e.stack || e);
    }

    if (e.solution) {
      console.log(_chalk.default.yellow(e.solution));
    }

    process.exit(1);
  }

  async getServerInfo(selectedServers, collectors) {
    if (this._cachedServerInfo && !collectors) {
      return this._cachedServerInfo;
    }

    const serverConfig = this.getConfig().servers;
    const servers = (selectedServers || Object.keys(this.getConfig().servers)).map(serverName => _objectSpread(_objectSpread({}, serverConfig[serverName]), {}, {
      name: serverName
    }));

    if (!collectors) {
      console.log('');
      console.log('=> Collecting Docker information');
    }

    const result = await (0, _serverInfo.default)(servers, collectors);

    if (!collectors) {
      this._cachedServerInfo = result;
    }

    return result;
  }

  serverInfoStale() {
    this._cachedServerInfo = null;
  }

  getSessions(modules = []) {
    const sessions = this._pickSessions(modules);

    return Object.keys(sessions).map(name => sessions[name]);
  }

  getSessionsForServers(servers = []) {
    if (!this.sessions) {
      this._loadSessions();
    }

    return servers.map(name => this.sessions[name]);
  }

  async getManagerSession() {
    const {
      currentManagers
    } = await this.swarmInfo();
    return this.getSessionsForServers(currentManagers)[0];
  }

  _pickSessions(plugins = []) {
    if (!this.sessions) {
      this._loadSessions();
    }

    const sessions = {};
    plugins.forEach(moduleName => {
      const moduleConfig = this.getConfig()[moduleName];

      if (!moduleConfig) {
        return;
      }

      for (const name in moduleConfig.servers) {
        if (!moduleConfig.servers.hasOwnProperty(name)) {
          continue;
        }

        if (this.sessions[name]) {
          sessions[name] = this.sessions[name];
        }
      }
    });
    return sessions;
  }

  _loadSessions() {
    const config = this.getConfig();
    this.sessions = {}; // `mup.servers` contains login information for servers
    // Use this information to create nodemiral sessions.

    for (const name in config.servers) {
      if (!config.servers.hasOwnProperty(name)) {
        continue;
      }

      if (this._enabledSessions.length > 0 && this._enabledSessions.indexOf(name) === -1) {
        continue;
      }

      const info = config.servers[name];
      const auth = {
        username: info.username
      };
      const opts = {
        keepAlive: true,
        ssh: info.opts || {}
      };
      const sshAgent = process.env.SSH_AUTH_SOCK;
      opts.ssh.keepaliveInterval = opts.ssh.keepaliveInterval || 1000 * 28;
      opts.ssh.keepaliveCountMax = opts.ssh.keepaliveCountMax || 12;

      if (info.pem) {
        try {
          auth.pem = _fs.default.readFileSync(resolvePath(info.pem), 'utf8');
        } catch (e) {
          console.error(`Unable to load pem at "${resolvePath(info.pem)}"`);
          console.error(`for server "${name}"`);

          if (e.code !== 'ENOENT') {
            console.log(e);
          }

          process.exit(1);
        }
      } else if (info.password) {
        auth.password = info.password;
      } else if (sshAgent && _fs.default.existsSync(sshAgent)) {
        opts.ssh.agent = sshAgent;
      } else {
        console.error("error: server %s doesn't have password, ssh-agent or pem", name);
        process.exit(1);
      }

      const session = _nodemiral.default.session(info.host, auth, opts);

      this.sessions[name] = session;
    }
  }

  _cleanupSessions() {
    log('cleaning up sessions');

    if (!this.sessions) {
      return;
    }

    Object.keys(this.sessions).forEach(key => {
      this.sessions[key].close();
    });
  }

  swarmEnabled() {
    const config = this.getConfig();
    return config.swarm && config.swarm.enabled;
  }

  async swarmInfo() {
    const info = await this.getServerInfo();
    const currentManagers = swarmUtils.currentManagers(info);
    const desiredManagers = swarmUtils.desiredManagers(this.getConfig(), info);
    const nodes = swarmUtils.findNodes(info);
    const nodeIdsToServer = swarmUtils.nodeIdsToServer(info);
    const desiredLabels = (0, _swarmOptions.getOptions)(this.getConfig()).labels;
    const currentLabels = swarmUtils.currentLabels(info);
    const clusters = swarmUtils.findClusters(info);

    if (Object.keys(clusters).length > 1) {
      swarmUtils.showClusters(clusters, nodeIdsToServer);
      const error = new Error('multiple-clusters');
      error.solution = 'The servers in your config are in multiple swarm clusters. Any servers already in a swarm cluster should be in the same cluster. Look above for the list of clusters.';
      throw error;
    }

    return {
      currentManagers,
      desiredManagers,
      nodes,
      nodeIDs: nodeIdsToServer,
      desiredLabels,
      currentLabels
    };
  }

  async dockerServiceInfo(serviceName) {
    const manager = await this.getManagerSession();

    if (!manager) {
      const error = new Error('no-manager');
      error.solution = 'Enable swarm in your config and run "mup setup"';
      throw error;
    }

    const result = await this.runSSHCommand(manager, `sudo docker service inspect ${serviceName}`);
    let serviceInfo = null;

    try {
      [serviceInfo] = JSON.parse(result.output);
    } catch (e) {// empty
    }

    return serviceInfo;
  }

}

exports.default = PluginAPI;
//# sourceMappingURL=plugin-api.js.map