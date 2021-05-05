"use strict";

var _index = _interopRequireWildcard(require("../index"));

var _chai = require("chai");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

describe('validator', () => {
  beforeEach(() => {
    for (const prop of Object.keys(_index._pluginValidators)) {
      delete _index._pluginValidators[prop];
    }
  });
  describe('addPluginValidator', () => {
    it('should add validator', () => {
      const handler = () => {};

      (0, _index.addPluginValidator)('metrics', handler);
      (0, _chai.expect)(_index._pluginValidators.metrics[0]).to.equal(handler);
    });
    it('should add multiple validators', () => {
      const handler = () => {};

      const handler2 = () => {};

      (0, _index.addPluginValidator)('metrics', handler);
      (0, _index.addPluginValidator)('metrics', handler2);
      (0, _chai.expect)(_index._pluginValidators.metrics[0]).to.equal(handler);
      (0, _chai.expect)(_index._pluginValidators.metrics[1]).to.equal(handler2);
    });
  });
  describe('validate', () => {
    it('should validate the config', () => {
      const config = {
        servers: {
          one: {
            host: '0.0.0.0'
          }
        }
      };
      let problems;

      try {
        problems = (0, _index.default)(config);
      } catch (e) {
        console.log(e);
      } // console.log(errors);


      (0, _chai.expect)(problems.errors).instanceOf(Array);
      (0, _chai.expect)(problems.depreciations).instanceOf(Array);
    });
  });
});
//# sourceMappingURL=index.unit.js.map