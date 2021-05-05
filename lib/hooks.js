"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerHook = registerHook;
exports.runRemoteHooks = runRemoteHooks;
exports.hooks = void 0;

var _utils = require("./utils");

const hooks = {};
exports.hooks = hooks;

function registerHook(_hookName, _handler) {
  let hookName = _hookName;
  let handler = _handler;

  if ((0, _utils.countOccurences)('\\.', hookName) === 1) {
    const sections = hookName.split('.');
    hookName = `${sections[0]}.default.${sections[1]}`;
  }

  if (typeof handler === 'function') {
    handler = {
      method: _handler
    };
  }

  if (hookName in hooks) {
    hooks[hookName].push(handler);
  } else {
    hooks[hookName] = [handler];
  }
}

async function runRemoteHooks(serversConfig, command) {
  return Promise.all(Object.values(serversConfig).map(server => (0, _utils.runSSHCommand)(server, command).then(({
    output
  }) => {
    console.log(`=> output from ${server.host}`);
    console.log(output);
  }).catch(e => {
    console.error(`Error running remote hook command: ${command}`);
    console.error(e);
  })));
}
//# sourceMappingURL=hooks.js.map