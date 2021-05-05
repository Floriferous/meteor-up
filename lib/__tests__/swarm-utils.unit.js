"use strict";

var _swarmUtils = require("../swarm-utils");

var _chai = require("chai");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createServerInfo(servers) {
  return servers.reduce((result, options) => {
    result[options.name] = {
      swarm: {
        LocalNodeState: options.state || 'active',
        Cluster: 'cluster' in options ? options.cluster : {}
      }
    };
    return result;
  }, {});
}

describe('swarm-utils', () => {
  describe('currentManagers', () => {
    it('should return active managers', () => {
      const serverInfo = createServerInfo([{
        name: 'one'
      }, {
        name: 'two',
        state: 'inactive'
      }, {
        name: 'three',
        cluster: null
      }]);
      const result = ['one'];
      (0, _chai.expect)((0, _swarmUtils.currentManagers)(serverInfo)).to.deep.equal(result);
    });
  });
  describe('calculateAdditionalManagers', () => {
    const fourServersConfig = {
      servers: {
        one: {},
        two: {},
        three: {},
        four: {}
      }
    };
    it('should be at least 1 when no requested managers', () => {
      const config = {
        servers: {
          one: {},
          two: {}
        }
      };
      (0, _chai.expect)((0, _swarmUtils.calculateAdditionalManagers)(config)).to.equal(1);
    });
    it('should be at least 3 when there is enough servers', () => {
      (0, _chai.expect)((0, _swarmUtils.calculateAdditionalManagers)(fourServersConfig)).to.equal(3);
    });
    it('should subtract requested managers', () => {
      const config = _objectSpread(_objectSpread({}, fourServersConfig), {}, {
        proxy: {
          servers: {
            one: {}
          }
        }
      });

      (0, _chai.expect)((0, _swarmUtils.calculateAdditionalManagers)(config)).to.equal(2);
    });
    it('should be odd when enough servers', () => {
      const config = {
        servers: {
          one: {},
          two: {},
          three: {},
          four: {},
          five: {}
        },
        proxy: {
          servers: {
            one: {},
            two: {},
            three: {},
            four: {}
          }
        }
      };
      (0, _chai.expect)((0, _swarmUtils.calculateAdditionalManagers)(config)).to.equal(1);
    });
    it('should be even when not enough servers', () => {
      const config = _objectSpread(_objectSpread({}, fourServersConfig), {}, {
        proxy: {
          servers: {
            one: {},
            two: {},
            three: {},
            four: {}
          }
        }
      });

      (0, _chai.expect)((0, _swarmUtils.calculateAdditionalManagers)(config)).to.equal(0);
    });
  });
  describe('desiredManagers', () => {
    it('should use requested servers', () => {
      const config = {
        servers: {
          one: {},
          two: {}
        },
        swarm: {},
        proxy: {
          servers: {
            one: {}
          }
        }
      };
      const result = ['one'];
      (0, _chai.expect)((0, _swarmUtils.desiredManagers)(config)).to.deep.equal(result);
    });
    it('should have 3 managers if possible', () => {
      const config = {
        servers: {
          one: {},
          two: {},
          three: {}
        }
      };
      const serverInfo = createServerInfo([{
        name: 'one',
        cluster: null
      }, {
        name: 'two',
        cluster: null
      }, {
        name: 'three',
        cluster: null
      }]);
      const result = ['one', 'two', 'three'];
      (0, _chai.expect)((0, _swarmUtils.desiredManagers)(config, serverInfo)).to.deep.equal(result);
    });
    it('should use existing managers', () => {
      const config = {
        servers: {
          one: {},
          two: {}
        }
      };
      const serverInfo = createServerInfo([{
        name: 'one',
        cluster: null
      }, {
        name: 'two'
      }]);
      const result = ['two'];
      (0, _chai.expect)((0, _swarmUtils.desiredManagers)(config, serverInfo)).to.deep.equal(result);
    });
  });
});
//# sourceMappingURL=swarm-utils.unit.js.map