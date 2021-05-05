"use strict";

var _prepareConfig = require("../prepare-config");

var _chai = require("chai");

describe('prepare-config', () => {
  beforeEach(() => {
    _prepareConfig._configPreps.length = 0;
  });
  it('should register preparers', () => {
    const preparer = function () {};

    (0, _prepareConfig.registerPreparer)(preparer);
    (0, _chai.expect)(_prepareConfig._configPreps[0]).to.equal(preparer);
  });
  it('should run config preps', () => {
    const preparer = function (config) {
      (0, _chai.expect)(config).to.be.an('object');
      config.ran = true;
      return config;
    };

    (0, _prepareConfig.registerPreparer)(preparer);
    const config = (0, _prepareConfig.runConfigPreps)({
      ran: false
    });
    (0, _chai.expect)(config).to.deep.equal({
      ran: true
    });
  });
});
//# sourceMappingURL=prepare-config.unit.js.map