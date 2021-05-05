"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.seperateCollectors = seperateCollectors;
exports.parseCollectorOutput = parseCollectorOutput;
exports.createHostResult = createHostResult;
exports.getServerInfo = getServerInfo;
exports.default = serverInfo;
exports._collectors = exports.builtInParsers = void 0;

var _debug = _interopRequireDefault(require("debug"));

var _bluebird = require("bluebird");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)('mup:server-info');

function parseJSONArray(stdout, code) {
  if (code === 0) {
    try {
      let output = stdout.split('\n').join(',');
      output = `[${output}]`;
      const result = JSON.parse(output);

      if (!(result instanceof Array)) {
        return [result];
      }

      return result;
    } catch (e) {
      return null;
    }
  }

  return null;
}

const builtInParsers = {
  json(stdout, code) {
    if (code === 0) {
      try {
        // Some commands, such as Docker, will sometimes show some
        // messages before the JSON
        const jsonOutput = stdout.slice(stdout.indexOf('{'));
        return JSON.parse(jsonOutput);
      } catch (e) {
        return null;
      }
    }

    return null;
  },

  jsonArray: parseJSONArray
};
exports.builtInParsers = builtInParsers;
const _collectors = {
  swarm: {
    command: 'sudo docker info --format \'{{json .Swarm}}\'',
    parser: builtInParsers.json
  },
  swarmNodes: {
    command: 'sudo docker node inspect $(sudo docker node ls -q) --format \'{{json .}}\'',
    parser: parseJSONArray
  },
  swarmToken: {
    command: 'sudo docker swarm join-token worker -q',

    parser(stdout, code) {
      if (code === 0 && stdout.indexOf('Error response') === -1) {
        return stdout.trim();
      }

      return null;
    }

  },
  images: {
    command: 'sudo docker images --format \'{{json .}}\'',
    parser: parseJSONArray
  }
};
exports._collectors = _collectors;
const prefix = '<============mup-var-start========';
const suffix = '================mup-var-stop=====>';
const codeSeperator = 'mup-var-code=======';

function generateVarCommand(name, command) {
  return `
  echo "${prefix}${name}${suffix}"
  ${command} 2>&1
  echo "${codeSeperator}"
  echo $?
  `;
}

function generateScript(collectors) {
  let script = '';
  Object.keys(collectors).forEach(key => {
    const collector = collectors[key];
    script += generateVarCommand(key, collector.command);
  });
  return script;
}

function seperateCollectors(output) {
  const collectors = output.split(prefix);
  collectors.shift();
  return collectors.map(collectorOutput => {
    const name = collectorOutput.split(suffix)[0];
    const commandOutput = collectorOutput.split(suffix)[1].split(codeSeperator)[0];
    return {
      name: name.trim(),
      output: commandOutput.trim(),
      code: parseInt(collectorOutput.split(codeSeperator)[1].trim(), 10)
    };
  });
}

function parseCollectorOutput(name, output, code, collectors) {
  if (typeof collectors[name].parser === 'string') {
    return builtInParsers[collectors[name].parser](output, code);
  }

  return collectors[name].parser(output, code);
}

function createHostResult(collectorData, host, serverName, collectors) {
  const result = {
    _host: host,
    _serverName: serverName
  };
  collectorData.forEach(data => {
    result[data.name] = parseCollectorOutput(data.name, data.output, data.code, collectors);
  });
  return result;
}

function getServerInfo(server, collectors) {
  const command = generateScript(collectors);
  return (0, _utils.runSSHCommand)(server, command).then(result => {
    const collectorData = seperateCollectors(result.output);
    const hostResult = createHostResult(collectorData, server.host, server.name, collectors);
    return hostResult;
  }).catch(err => {
    console.log(err, server);
  });
}

function serverInfo(servers, collectors = _collectors) {
  log('starting');
  return (0, _bluebird.map)(servers, server => getServerInfo(server, collectors), {
    concurrency: Object.keys(servers).length
  }).then(serverResults => {
    log('finished');
    return serverResults.reduce((result, serverResult) => {
      result[serverResult._serverName] = serverResult;
      return result;
    }, {});
  });
}
//# sourceMappingURL=server-info.js.map