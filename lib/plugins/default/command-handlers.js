"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deploy = deploy;
exports.logs = logs;
exports.reconfig = reconfig;
exports.restart = restart;
exports.setup = setup;
exports.start = start;
exports.stop = stop;
exports.ssh = ssh;
exports.validate = validate;
exports.status = status;

var _chalk = _interopRequireDefault(require("chalk"));

var _ssh = require("ssh2");

var _debug = _interopRequireDefault(require("debug"));

var _bluebird = require("bluebird");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)('mup:module:default');

function deploy() {
  log('exec => mup deploy');
}

function logs() {
  log('exec => mup logs');
}

function reconfig() {
  log('exec => mup reconfig');
}

function restart() {
  log('exec => mup restart');
}

function setup(api) {
  process.on('exit', code => {
    if (code > 0) {
      return;
    }

    console.log('');
    console.log('Next, you should run:');
    console.log('    mup deploy');
  });
  log('exec => mup setup');
  return api.runCommand('docker.setup');
}

function start() {
  log('exec => mup start');
}

function stop() {
  log('exec => mup stop');
}

function ssh(api) {
  const servers = api.getConfig().servers;
  let serverOption = api.getArgs()[1]; // Check how many sessions are enabled. Usually is all servers,
  // but can be reduced by the `--servers` option

  const enabledSessions = api.getSessionsForServers(Object.keys(servers)).filter(session => session);

  if (!(serverOption in servers)) {
    if (enabledSessions.length === 1) {
      const selectedHost = enabledSessions[0]._host;
      serverOption = Object.keys(servers).find(name => servers[name].host === selectedHost);
    } else {
      console.log('mup ssh <server>');
      console.log('Available servers are:\n', Object.keys(servers).join('\n '));
      process.exitCode = 1;
      return;
    }
  }

  const server = servers[serverOption];

  const sshOptions = api._createSSHOptions(server);

  const conn = new _ssh.Client();
  conn.on('ready', () => {
    conn.shell((err, stream) => {
      if (err) {
        throw err;
      }

      stream.on('close', () => {
        conn.end();
        process.exit();
      });
      process.stdin.setRawMode(true);
      process.stdin.pipe(stream);
      stream.pipe(process.stdout);
      stream.stderr.pipe(process.stderr);
      stream.setWindow(process.stdout.rows, process.stdout.columns);
      process.stdout.on('resize', () => {
        stream.setWindow(process.stdout.rows, process.stdout.columns);
      });
    });
  }).connect(sshOptions);
}

function validate(api) {
  // Shows validation errors
  api.getConfig();

  if (api.getOptions().show || api.getOptions().scrub) {
    let config = api.getConfig();

    if (api.getOptions().scrub) {
      config = api.scrubConfig();
    }

    console.log(JSON.stringify(config, null, 2));
  }

  const errors = api.validateConfig('');

  if (errors.length > 0) {
    process.exitCode = 1;
  } else {
    console.log(_chalk.default.green('\u2713 Config is valid'));
  }
}

function statusColor(versionCorrect, distributionCorrect, hasAptGet, defaultBash, _overallColor) {
  let color = _chalk.default.green;
  let overallColor = _overallColor;

  if (!hasAptGet) {
    color = _chalk.default.red;
    overallColor = 'red';
  } else if (!distributionCorrect) {
    color = _chalk.default.yellow;

    if (overallColor !== 'red') {
      overallColor = 'yellow';
    }
  } else if (!versionCorrect) {
    color = _chalk.default.red;
    overallColor = 'red';
  } else if (!defaultBash) {
    color = _chalk.default.red;
    overallColor = 'red';
  }

  return {
    color,
    overallColor
  };
}

async function status(api) {
  const servers = Object.values(api.getConfig().servers);
  const lines = [];
  let overallColor = 'green';
  const command = 'lsb_release -r -s || echo "false"; lsb_release -is; apt-get -v &> /dev/null && echo "true" || echo "false"; echo $BASH';
  const results = await (0, _bluebird.map)(servers, server => api.runSSHCommand(server, command), {
    concurrency: 2
  });
  results.forEach(({
    host,
    output
  }) => {
    let text = `  - ${host}: `;
    let color = _chalk.default.green;
    const [version, distribution, aptGet, bash = ''] = output.trim().split('\n');
    const versionCorrect = parseInt(version, 10) > 13;
    const distributionCorrect = distribution === 'Ubuntu';
    const hasAptGet = aptGet.trim() === 'true';
    const defaultBash = bash.trim().length > 0;
    const colors = statusColor(versionCorrect, distributionCorrect, hasAptGet, defaultBash, overallColor);
    color = colors.color;
    overallColor = colors.overallColor;
    text += color(`${distribution} ${version}`);

    if (!hasAptGet) {
      text += _chalk.default.red(' apt-get not available');
    }

    if (!defaultBash) {
      text += _chalk.default.red(' Bash is not the default shell');
    }

    lines.push(text);
  });
  console.log(_chalk.default[overallColor]('=> Servers'));
  console.log(lines.join('\n'));
}
//# sourceMappingURL=command-handlers.js.map