"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addStdioHandlers = addStdioHandlers;
exports.runTaskList = runTaskList;
exports.getDockerLogs = getDockerLogs;
exports.createSSHOptions = createSSHOptions;
exports.runSSHCommand = runSSHCommand;
exports.forwardPort = forwardPort;
exports.countOccurences = countOccurences;
exports.resolvePath = resolvePath;
exports.moduleNotFoundIsPath = moduleNotFoundIsPath;
exports.argvContains = argvContains;
exports.createOption = createOption;
exports.filterArgv = filterArgv;

var _ssh = require("ssh2");

var _debug = _interopRequireDefault(require("debug"));

var _expandTilde = _interopRequireDefault(require("expand-tilde"));

var _fs = _interopRequireDefault(require("fs"));

var _net = _interopRequireDefault(require("net"));

var _nodemiral = _interopRequireDefault(require("@zodern/nodemiral"));

var _path2 = _interopRequireDefault(require("path"));

var _bluebird = require("bluebird");

var _readline = _interopRequireDefault(require("readline"));

var _stream = _interopRequireDefault(require("stream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)('mup:utils');

function addStdioHandlers(list) {
  list._taskQueue = list._taskQueue.map(task => {
    task.options = task.options || {};

    task.options.onStdout = () => data => {
      process.stdout.write(data);
    };

    task.options.onStderr = () => data => {
      process.stderr.write(data);
    };

    return task;
  });
}

function runTaskList(list, sessions, opts) {
  if (opts && opts.verbose) {
    addStdioHandlers(list);
    delete opts.verbose;
  }

  if (opts && opts.showDuration) {
    list._taskQueue.forEach(task => {
      task.options = task.options || {};
      task.options.showDuration = true;
    });

    delete opts.showDuration;
  }

  return new Promise((resolve, reject) => {
    list.run(sessions, opts, summaryMap => {
      for (const host in summaryMap) {
        if (summaryMap.hasOwnProperty(host)) {
          const summary = summaryMap[host];

          if (summary.error) {
            const error = summary.error;
            error.nodemiralHistory = summary.history;
            reject(error);
            return;
          }
        }
      }

      resolve();
    });
  });
} // Implements a simple readable stream to pass
// the logs from nodemiral to readline which
// then splits it into individual lines.


class Callback2Stream extends _stream.default.Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor
    super(options);
    this.data = [];
  }

  addData(data) {
    if (this.reading) {
      this.reading = this.push(data);
    } else {
      this.data.push(data);
    }
  }

  _read() {
    this.reading = true;
    this.data.forEach(() => {
      const shouldContinue = this.reading && this.push(this.data.shift());

      if (!shouldContinue) {
        this.reading = false;
      }
    });
  }

}

function getDockerLogs(name, sessions, args, showHost = true) {
  const command = `sudo docker ${args.join(' ')} ${name} 2>&1`;
  log(`getDockerLogs command: ${command}`);
  const promises = sessions.map(session => {
    const input = new Callback2Stream();
    const host = showHost ? `[${session._host}]` : '';

    const lineSeperator = _readline.default.createInterface({
      input,
      terminal: true
    });

    lineSeperator.on('line', data => {
      console.log(host + data);
    });
    const options = {
      onStdout: data => {
        input.addData(data);
      },
      onStderr: data => {
        // the logs all come in on stdout so stderr isn't added to lineSeperator
        process.stdout.write(host + data);
      }
    };
    return (0, _bluebird.promisify)(session.execute.bind(session))(command, options);
  });
  return Promise.all(promises);
}

function createSSHOptions(server) {
  const sshAgent = process.env.SSH_AUTH_SOCK;
  const ssh = {
    host: server.host,
    port: server.opts && server.opts.port || 22,
    username: server.username
  };

  if (server.pem) {
    ssh.privateKey = _fs.default.readFileSync(resolvePath(server.pem), 'utf8');
  } else if (server.password) {
    ssh.password = server.password;
  } else if (sshAgent && _fs.default.existsSync(sshAgent)) {
    ssh.agent = sshAgent;
  }

  return ssh;
}

function runSessionCommand(session, command) {
  return new Promise((resolve, reject) => {
    let client;
    let done; // callback is called synchronously

    session._withSshClient((_client, _done) => {
      client = _client;
      done = _done;
    });

    let output = '';
    client.execute(command, {
      onStderr: data => {
        output += data;
      },
      onStdout: data => {
        output += data;
      }
    }, (err, result) => {
      // eslint-disable-next-line callback-return
      done();

      if (err) {
        return reject(err);
      }

      resolve({
        code: result.code,
        output,
        host: session._host
      });
    });
  });
} // info can either be an object from the server object in the config
// or it can be a nodemiral session


function runSSHCommand(info, command) {
  if (info instanceof _nodemiral.default.session) {
    return runSessionCommand(info, command);
  }

  return new Promise((resolve, reject) => {
    const ssh = createSSHOptions(info);
    const conn = new _ssh.Client();
    conn.connect(ssh);
    conn.once('error', err => {
      if (err) {
        reject(err);
      }
    }); // TODO handle error events

    conn.once('ready', () => {
      conn.exec(command, (err, outputStream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }

        let output = '';
        outputStream.on('data', data => {
          output += data;
        });
        outputStream.stderr.on('data', data => {
          output += data;
        });
        outputStream.once('close', code => {
          conn.end();
          resolve({
            code,
            output,
            host: info.host
          });
        });
      });
    });
  });
}

function forwardPort({
  server,
  localAddress,
  localPort,
  remoteAddress,
  remotePort,
  onReady,
  onError,
  onConnection = () => {}
}) {
  const sshOptions = createSSHOptions(server);

  const netServer = _net.default.createServer(netConnection => {
    const sshConnection = new _ssh.Client();
    sshConnection.on('ready', () => {
      sshConnection.forwardOut(localAddress, localPort, remoteAddress, remotePort, (err, sshStream) => {
        if (err) {
          return onError(err);
        }

        onConnection();
        netConnection.pipe(sshStream);
        sshStream.pipe(netConnection);
      });
    }).connect(sshOptions);
  });

  netServer.listen(localPort, localAddress, error => {
    if (error) {
      onError(error);
    } else {
      onReady();
    }
  });
}

function countOccurences(needle, haystack) {
  const regex = new RegExp(needle, 'g');
  const match = haystack.match(regex) || [];
  return match.length;
}

function resolvePath(...paths) {
  const expandedPaths = paths.map(_path => (0, _expandTilde.default)(_path));
  return _path2.default.resolve(...expandedPaths);
}
/**
 * Checks if the module not found by `require` is a certain module
 *
 * @param {Error} e - Error that was thrown
 * @param {String} modulePath - path to the module to compare the error to
 * @returns {Boolean} true if the modulePath and path in the error is the same
 */


function moduleNotFoundIsPath(e, modulePath) {
  const message = e.message.split('\n')[0];
  const pathPosition = message.length - modulePath.length - 1;
  return message.indexOf(modulePath) === pathPosition;
}

function argvContains(argvArray, option) {
  if (argvArray.indexOf(option) > -1) {
    return true;
  }

  return argvArray.find(value => value.indexOf(`${option}=`) > -1);
}

function createOption(key) {
  if (key.length > 1) {
    return `--${key}`;
  }

  return `-${key}`;
}

function filterArgv(argvArray, argv, unwanted) {
  const result = argv._.slice();

  Object.keys(argv).forEach(key => {
    const option = createOption(key);

    if (unwanted.indexOf(key) === -1 && argv[key] !== false && argv[key] !== undefined) {
      if (!argvContains(argvArray, option)) {
        return;
      }

      result.push(option);

      if (typeof argv[key] !== 'boolean') {
        result.push(argv[key]);
      }
    }
  });
  return result;
}
//# sourceMappingURL=utils.js.map