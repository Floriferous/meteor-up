"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logs = logs;
exports.leLogs = leLogs;
exports.setup = setup;
exports.reconfigShared = reconfigShared;
exports.start = start;
exports.stop = stop;
exports.nginxConfig = nginxConfig;
exports.status = status;
exports.updateProxyForLoadBalancing = updateProxyForLoadBalancing;

var _utils = require("./utils");

var _chalk = _interopRequireDefault(require("chalk"));

var _lodash = require("lodash");

var _debug = _interopRequireDefault(require("debug"));

var _fs = _interopRequireDefault(require("fs"));

var _nodemiral = _interopRequireDefault(require("@zodern/nodemiral"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)('mup:module:proxy');
const PROXY_CONTAINER_NAME = 'mup-nginx-proxy';

function logs(api) {
  log('exec => mup proxy logs');
  const config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const args = api.getArgs().slice(1);
  const sessions = (0, _utils.getSessions)(api);
  return api.getDockerLogs(PROXY_CONTAINER_NAME, sessions, args);
}

function leLogs(api) {
  log('exec => mup proxy le-logs');
  const config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const args = api.getArgs().slice(1);
  args[0] = 'logs';
  const sessions = api.getSessions(['app']);
  return api.getDockerLogs(`${PROXY_CONTAINER_NAME}-letsencrypt`, sessions, args);
}

function setup(api) {
  log('exec => mup proxy setup');
  const config = api.getConfig().proxy;
  const serverConfig = api.getConfig().servers;
  const appConfig = api.getConfig().app;
  const appName = appConfig.name;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const sessions = (0, _utils.getSessions)(api);

  const list = _nodemiral.default.taskList('Setup proxy');

  const domains = config.domains.split(',');
  list.executeScript('Setup Environment', {
    script: api.resolvePath(__dirname, 'assets/proxy-setup.sh'),
    vars: {
      name: PROXY_CONTAINER_NAME,
      appName
    }
  });
  list.copy('Pushing the Startup Script', {
    src: api.resolvePath(__dirname, 'assets/templates/start.sh'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/start.sh`,
    vars: {
      appName: PROXY_CONTAINER_NAME,
      letsEncryptEmail: config.ssl ? config.ssl.letsEncryptEmail : null,
      swarmEnabled: api.swarmEnabled()
    }
  });
  list.copy('Pushing Nginx Config Template', {
    src: api.resolvePath(__dirname, 'assets/nginx.tmpl'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/nginx.tmpl`
  });
  let nginxServerConfig = '';

  if (config.nginxServerConfig) {
    nginxServerConfig = _fs.default.readFileSync(api.resolvePath(api.getBasePath(), config.nginxServerConfig)).toString('utf8');
  }

  let nginxLocationConfig = '';

  if (config.nginxLocationConfig) {
    nginxLocationConfig = _fs.default.readFileSync(api.resolvePath(api.getBasePath(), config.nginxLocationConfig)).toString('utf8');
  }

  list.executeScript('Pushing Nginx Config', {
    script: api.resolvePath(__dirname, 'assets/nginx-config.sh'),
    vars: {
      hasServerConfig: config.nginxServerConfig,
      hasLocationConfig: config.nginxLocationConfig,
      serverConfig: nginxServerConfig,
      locationConfig: nginxLocationConfig,
      domains,
      proxyName: PROXY_CONTAINER_NAME,
      clientUploadLimit: config.clientUploadLimit || '10M'
    }
  });
  list.executeScript('Cleaning Up SSL Certificates', {
    script: api.resolvePath(__dirname, 'assets/ssl-cleanup.sh'),
    vars: {
      name: appName,
      proxyName: PROXY_CONTAINER_NAME
    }
  });

  if (config.ssl && !config.ssl.letsEncryptEmail && config.ssl.upload !== false && config.ssl.crt) {
    list.copy('Copying SSL Certificate Bundle', {
      src: api.resolvePath(api.getBasePath(), config.ssl.crt),
      dest: `/opt/${appName}/config/bundle.crt`
    });
    list.copy('Copying SSL Private Key', {
      src: api.resolvePath(api.getBasePath(), config.ssl.key),
      dest: `/opt/${appName}/config/private.key`
    });
    list.executeScript('Setup SSL Certificates for Domains', {
      script: api.resolvePath(__dirname, 'assets/ssl-setup.sh'),
      vars: {
        appName,
        proxyName: PROXY_CONTAINER_NAME,
        domains
      }
    });
  }

  const hostnames = (0, _utils.getLoadBalancingHosts)(serverConfig, Object.keys(appConfig.servers));
  list.executeScript('Configure Nginx Upstream', {
    script: api.resolvePath(__dirname, 'assets/upstream.sh'),
    vars: {
      domains,
      name: appName,
      setUpstream: !api.swarmEnabled() && config.loadBalancing,
      stickySessions: config.stickySessions !== false,
      proxyName: PROXY_CONTAINER_NAME,
      port: appConfig.env.PORT,
      hostnames
    }
  });
  return api.runTaskList(list, sessions, {
    series: false,
    verbose: api.getVerbose()
  }).then(() => api.runCommand('proxy.start'));
}

function reconfigShared(api) {
  const config = api.getConfig().proxy;
  const shared = config.shared || {};

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  console.log('The shared settings affect all apps using this reverse proxy.');

  if (Object.keys(shared).length === 0) {
    console.log('No shared config properties are set. Resetting proxy to defaults.');
  }

  const list = _nodemiral.default.taskList('Configuring Proxy\'s Shared Settings');

  list.copy('Sending shared variables', {
    src: api.resolvePath(__dirname, 'assets/templates/shared-config.sh'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/shared-config.sh`,
    vars: {
      httpPort: shared.httpPort,
      httpsPort: shared.httpsPort,
      clientUploadLimit: shared.clientUploadLimit
    }
  });
  const env = (0, _lodash.clone)(shared.env);
  list.copy('Sending proxy environment variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/env.list`,
    vars: {
      env: env || {}
    }
  });
  const envLetsEncrypt = (0, _lodash.clone)(shared.envLetsEncrypt);
  list.copy('Sending let\'s encrypt environment variables', {
    src: api.resolvePath(__dirname, 'assets/templates/env.list'),
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/env_letsencrypt.list`,
    vars: {
      env: envLetsEncrypt || {}
    }
  });
  const sharedNginxConfig = shared.nginxConfig || api.resolvePath(__dirname, 'assets/proxy.conf');
  list.copy('Sending nginx config', {
    src: sharedNginxConfig,
    dest: `/opt/${PROXY_CONTAINER_NAME}/config/nginx-default.conf`
  });

  if (shared.templatePath) {
    const templatePath = shared.templatePath;
    list.copy('Pushing Nginx Config Template', {
      src: templatePath,
      dest: `/opt/${PROXY_CONTAINER_NAME}/config/nginx-shared.tmpl`
    });
  } else {
    list.executeScript('Cleanup Template', {
      script: api.resolvePath(__dirname, 'assets/cleanup-template.sh'),
      vars: {
        appName: PROXY_CONTAINER_NAME
      }
    });
  }

  const sessions = (0, _utils.getSessions)(api);
  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.verbose
  }).then(() => api.runCommand('proxy.start'));
}

function start(api) {
  log('exec => mup proxy start');
  const config = api.getConfig().proxy;

  if (!config) {
    console.error('error: no configs found for proxy');
    process.exit(1);
  }

  const sessions = (0, _utils.getSessions)(api);

  const list = _nodemiral.default.taskList('Start proxy');

  list.executeScript('Start proxy', {
    script: api.resolvePath(__dirname, 'assets/proxy-start.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });
  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
}

function stop(api) {
  log('exec => mup proxy stop');

  const list = _nodemiral.default.taskList('Stop proxy');

  list.executeScript('Stop proxy', {
    script: api.resolvePath(__dirname, 'assets/proxy-stop.sh'),
    vars: {
      appName: PROXY_CONTAINER_NAME
    }
  });
  const sessions = (0, _utils.getSessions)(api);
  return api.runTaskList(list, sessions, {
    verbose: api.getVerbose()
  });
}

async function nginxConfig(api) {
  log('exec => mup proxy nginx-config');
  const command = `docker exec ${PROXY_CONTAINER_NAME} cat /etc/nginx/conf.d/default.conf`;
  const sessions = (0, _utils.getSessions)(api);
  await Promise.all(sessions.map(session => api.runSSHCommand(session, command))).then(results => {
    results.forEach(({
      host,
      output
    }) => {
      console.log(`===== ${host} ======`);
      console.log(output);
    });
  });
}

async function status(api) {
  const config = api.getConfig();
  const lines = [];
  let overallColor = 'green';

  if (!config.proxy) {
    if (config.swarm && config.app && config.app.type === 'meteor') {
      console.log(_chalk.default.yellow('Proxy should be enabled when using swarm for load balancing to work.'));
    }

    return;
  }

  const servers = Object.keys(config.proxy.servers || config.app.servers);
  const collectorConfig = {
    nginxDocker: {
      command: `docker inspect ${PROXY_CONTAINER_NAME} --format "{{json .}}"`,
      parser: 'json'
    },
    letsEncryptDocker: {
      command: `docker inspect ${PROXY_CONTAINER_NAME}-letsencrypt --format "{{json .}}"`,
      parser: 'json'
    },
    certificateExpire: {
      command: `cd /opt/${PROXY_CONTAINER_NAME}/mounted-certs && find . -name '*.chain.pem' -exec echo '{}' \\; -exec openssl x509 -enddate -noout -in '{}' \\;`,

      parser(stdout, code) {
        if (code === 0) {
          return stdout.split('\n').reduce((result, item, index, items) => {
            if (!(index % 2) && item.trim() !== '') {
              result[item.slice(2)] = items[index + 1].split('=')[1];
            }

            return result;
          }, {});
        }

        return null;
      }

    }
  };
  const serverInfo = await api.getServerInfo(servers, collectorConfig);
  Object.values(serverInfo).forEach(({
    _host,
    nginxDocker,
    letsEncryptDocker,
    certificateExpire
  }) => {
    lines.push(` - ${_host}:`);
    lines.push('   - NGINX:');
    lines.push(`     - Status: ${nginxDocker ? nginxDocker.State.Status : 'Stopped'}`);

    if (nginxDocker && nginxDocker.State.Status !== 'running') {
      overallColor = 'red';
    }

    if (nginxDocker) {
      lines.push('     - Ports:');
      Object.keys(nginxDocker.NetworkSettings.Ports || {}).forEach(key => {
        if (key === '443/tcp') {
          lines.push(`       - HTTPS: ${nginxDocker.NetworkSettings.Ports[key][0].HostPort}`);
        } else if (key === '80/tcp') {
          lines.push(`       - HTTP: ${nginxDocker.NetworkSettings.Ports[key][0].HostPort}`);
        }
      });
    }

    lines.push('   - Let\'s Encrypt');
    lines.push(`     - Status: ${letsEncryptDocker ? letsEncryptDocker.State.Status : 'Stopped'}`);

    if (letsEncryptDocker && letsEncryptDocker.State.Status !== 'running') {
      overallColor = 'red';
    }

    if (certificateExpire && certificateExpire.length > 0) {
      lines.push('     - Certificates');
      Object.keys(certificateExpire).forEach(key => {
        lines.push(`       - ${key}: ${certificateExpire[key]}`);
      });
    }
  });
  console.log(_chalk.default[overallColor]('\n=> Reverse Proxy Status'));
  console.log(lines.join('\n'));
}

function updateProxyForLoadBalancing(api) {
  const config = api.getConfig();
  const sessions = (0, _utils.getSessions)(api);

  const list = _nodemiral.default.taskList('Configure Proxy for Service');

  list.executeScript('Configure Proxy', {
    script: api.resolvePath(__dirname, 'assets/service-configure.sh'),
    vars: {
      appName: config.app.name,
      imagePort: config.app.docker.imagePort,
      env: (0, _utils.addProxyEnv)(config, {}),
      domains: config.proxy.domains.split(','),
      proxyName: PROXY_CONTAINER_NAME,
      swarmEnabled: api.swarmEnabled()
    }
  });
  return api.runTaskList(list, sessions, {
    series: true,
    verbose: api.getVerbose()
  });
}
//# sourceMappingURL=command-handlers.js.map