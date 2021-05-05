"use strict";

var _loadPlugins = _interopRequireWildcard(require("../load-plugins"));

var _chai = require("chai");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

describe('load-plugins', () => {
  it('should load included plugins', () => {
    (0, _chai.expect)(Object.keys(_loadPlugins.default)).to.have.length.greaterThan(4);
    (0, _chai.expect)(Object.keys(_loadPlugins.default)).to.contain('default');
  });
  describe('locatePluginDir', () => {
    it('should identify paths', () => {
      const configPath = '/projects/a/mup.js';

      function createResult(value) {
        return (0, _loadPlugins.locatePluginDir)(value, configPath).replace(/\\/g, '/');
      }

      (0, _chai.expect)(createResult('./test')).to.contain('/projects/a/test');
      (0, _chai.expect)(createResult('~/test')).to.contain('/test');
      (0, _chai.expect)(createResult('/test')).to.length.lessThan(10);
    });
  });
});
//# sourceMappingURL=load-plugins.unit.js.map