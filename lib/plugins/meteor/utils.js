"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkAppStarted = checkAppStarted;
exports.addStartAppTask = addStartAppTask;
exports.createEnv = createEnv;
exports.createServiceConfig = createServiceConfig;
exports.getNodeVersion = getNodeVersion;
exports.escapeEnvQuotes = escapeEnvQuotes;
exports.getSessions = getSessions;
exports.tmpBuildPath = tmpBuildPath;
exports.runCommand = runCommand;
exports.getBuildOptions = getBuildOptions;
exports.shouldRebuild = shouldRebuild;
exports.getImagePrefix = getImagePrefix;
exports.currentImageTag = currentImageTag;
exports.readFileFromTar = readFileFromTar;

var _lodash = require("lodash");

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _prepareBundle = require("./prepare-bundle.js");

var _randomSeed = _interopRequireDefault(require("random-seed"));

var _child_process = require("child_process");

var _tar = _interopRequireDefault(require("tar"));

var _uuid = _interopRequireDefault(require("uuid"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function checkAppStarted(list, api) {
  const script = api.resolvePath(__dirname, 'assets/meteor-deploy-check.sh');
  const {
    app,
    privateDockerRegistry
  } = api.getConfig();
  const publishedPort = app.docker.imagePort || 80;
  list.executeScript('Verifying Deployment', {
    script,
    vars: {
      deployCheckWaitTime: app.deployCheckWaitTime || 60,
      appName: app.name,
      deployCheckPort: publishedPort,
      privateRegistry: privateDockerRegistry,
      imagePrefix: getImagePrefix(privateDockerRegistry)
    }
  });
  return list;
}

function addStartAppTask(list, api) {
  const {
    app: appConfig,
    privateDockerRegistry
  } = api.getConfig();
  const isDeploy = api.commandHistory.find(({
    name
  }) => name === 'meteor.deploy');
  list.executeScript('Start Meteor', {
    script: api.resolvePath(__dirname, 'assets/meteor-start.sh'),
    vars: {
      appName: appConfig.name,
      removeImage: isDeploy && !(0, _prepareBundle.prepareBundleSupported)(appConfig.docker),
      privateRegistry: privateDockerRegistry
    }
  });
  return list;
}

function createEnv(appConfig, settings) {
  const env = (0, _lodash.cloneDeep)(appConfig.env);
  env.METEOR_SETTINGS = JSON.stringify(settings); // setting PORT in the config is used for the publicly accessible
  // port.
  // docker.imagePort is used for the port exposed from the container.
  // In case the docker.imagePort is different than the container's
  // default port, we set the env PORT to docker.imagePort.

  env.PORT = appConfig.docker.imagePort;
  return env;
}

function createServiceConfig(api, tag) {
  const {
    app,
    proxy
  } = api.getConfig();
  return {
    image: `mup-${app.name.toLowerCase()}:${tag || 'latest'}`,
    name: app.name,
    env: createEnv(app, api.getSettings()),
    replicas: Object.keys(app.servers).length,
    endpointMode: proxy ? 'dnsrr' : 'vip',
    networks: app.docker.networks,
    hostname: `{{.Node.Hostname}}-${app.name}-{{.Task.ID}}`,
    publishedPort: proxy ? null : app.env.PORT || 80,
    targetPort: proxy ? null : app.docker.imagePort,
    updateFailureAction: 'rollback',
    updateParallelism: Math.ceil(Object.keys(app.servers).length / 3),
    updateDelay: 20 * 1000,
    constraints: [`node.labels.mup-app-${app.name}==true`]
  };
}

async function getNodeVersion(bundlePath) {
  let star = await readFileFromTar(bundlePath, 'bundle/star.json');
  star = JSON.parse(star || '{}'); // star.json started having nodeVersion in Meteor 1.5.2

  if (star && star.nodeVersion) {
    return star.nodeVersion;
  }

  const nodeVersion = await readFileFromTar(bundlePath, 'bundle/.node_version.txt'); // Remove leading 'v'

  return nodeVersion.trim().substr(1);
}

function escapeEnvQuotes(env) {
  return Object.entries(env).reduce((result, [key, _value]) => {
    let value = _value;

    if (typeof value === 'string') {
      value = value.replace(/"/, '\\"');
    }

    result[key] = value;
    return result;
  }, {});
}

async function getSessions(api) {
  if (api.swarmEnabled()) {
    return [await api.getManagerSession()];
  }

  return api.getSessions(['app']);
}

function tmpBuildPath(appPath, api) {
  const rand = _randomSeed.default.create(appPath);

  const uuidNumbers = [];

  for (let i = 0; i < 16; i++) {
    uuidNumbers.push(rand(255));
  }

  return api.resolvePath(_os.default.tmpdir(), `mup-meteor-${_uuid.default.v4({
    random: uuidNumbers
  })}`);
}

function runCommand(_executable, _args, {
  cwd,
  stdin
} = {}) {
  return new Promise((resolve, reject) => {
    let executable = _executable;
    let args = _args;
    const isWin = /^win/.test(process.platform);

    if (isWin) {
      // Sometimes cmd.exe not available in the path
      // See: http://goo.gl/ADmzoD
      executable = process.env.comspec || 'cmd.exe';
      args = ['/c', _executable].concat(args);
    }

    const options = {
      cwd,
      stdio: [stdin ? 'pipe' : process.stdin, process.stdout, process.stderr]
    };
    const commandProcess = (0, _child_process.spawn)(executable, args, options);

    if (stdin) {
      commandProcess.stdin.setEncoding('utf-8');
      commandProcess.stdin.write(`${stdin}\r\n`);
      commandProcess.stdin.end();
    }

    commandProcess.on('error', e => {
      console.log(options);
      console.log(e);
      console.log(`This error usually happens when ${_executable} is not installed.`);
      return reject(e);
    });
    commandProcess.on('close', code => {
      if (code > 0) {
        return reject(new Error(`"${executable} ${args.join(' ')}" exited with the code ${code}`));
      }

      resolve();
    });
  });
}

function getBuildOptions(api) {
  const config = api.getConfig().app;
  const appPath = api.resolvePath(api.getBasePath(), config.path);
  const buildOptions = config.buildOptions || {};
  buildOptions.buildLocation = buildOptions.buildLocation || tmpBuildPath(appPath, api);
  return buildOptions;
}

function shouldRebuild(api) {
  let rebuild = true;
  const {
    buildLocation
  } = getBuildOptions(api);
  const bundlePath = api.resolvePath(buildLocation, 'bundle.tar.gz');

  if (api.getOptions()['cached-build']) {
    const buildCached = _fs.default.existsSync(bundlePath); // If build is not cached, rebuild remains true
    // even though the --cached-build flag was used


    if (buildCached) {
      rebuild = false;
    }
  }

  return rebuild;
}

function getImagePrefix(privateRegistry) {
  if (privateRegistry && privateRegistry.imagePrefix) {
    return `${privateRegistry.imagePrefix}/mup-`;
  }

  return 'mup-';
}

function currentImageTag(serverInfo, appName) {
  const result = (0, _lodash.flatMap)(Object.values(serverInfo), ({
    images
  }) => images || []).filter(image => image.Repository === `mup-${appName}`).map(image => parseInt(image.Tag, 10)).filter(tag => !isNaN(tag)).sort((a, b) => b - a);
  return result[0] || 0;
}

function readFileFromTar(tarPath, filePath) {
  const data = [];
  let found = false;

  const onentry = entry => {
    if (entry.path === filePath) {
      found = true;
      entry.on('data', d => data.push(d));
    }
  };

  return new Promise((resolve, reject) => {
    _tar.default.t({
      onentry,
      file: tarPath
    }, err => {
      if (err) {
        return reject(err);
      }

      if (!found) {
        return reject(new Error('file-not-found'));
      }

      const combined = Buffer.concat(data);
      resolve(combined.toString('utf-8'));
    });
  });
}
//# sourceMappingURL=utils.js.map