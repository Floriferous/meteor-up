"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.currentManagers = currentManagers;
exports.calculateAdditionalManagers = calculateAdditionalManagers;
exports.desiredManagers = desiredManagers;
exports.findNodes = findNodes;
exports.nodeIdsToServer = nodeIdsToServer;
exports.currentLabels = currentLabels;
exports.findClusters = findClusters;
exports.showClusters = showClusters;

var _lodash = _interopRequireDefault(require("lodash"));

var _debug = _interopRequireDefault(require("debug"));

var _swarmOptions = require("./swarm-options");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug.default)('mup:swarm-utils');

function currentManagers(serverInfo) {
  const hosts = [];
  Object.keys(serverInfo).forEach(key => {
    const server = serverInfo[key];

    if (server.swarm && server.swarm.LocalNodeState !== 'inactive' && server.swarm.Cluster) {
      hosts.push(key);
    }
  });
  log('current managers:', hosts);
  return hosts;
}

function calculateAdditionalManagers(config) {
  const {
    managers
  } = (0, _swarmOptions.getOptions)(config);
  const servers = Object.keys(config.servers);
  let additionalManagers = 0; // Try to get an odd number of managers

  if (managers.length % 2 === 0 && managers.length < servers.length) {
    additionalManagers = 1;
  } // When there are enough servers, make sure there are
  // at least 3 managers, since it can then handle one manager
  // going down


  if (servers.length >= 3 && managers.length < 3) {
    additionalManagers = 3 - managers.length;
  }

  return additionalManagers;
}

function desiredManagers(config, serverInfo) {
  const {
    managers
  } = (0, _swarmOptions.getOptions)(config);
  let additionalManagers = calculateAdditionalManagers(config);
  log('requested managers', managers);
  log('additional managers', additionalManagers);

  if (additionalManagers > 0) {
    const current = currentManagers(serverInfo);

    const diff = _lodash.default.difference(current, managers);

    const managersToAdd = diff.splice(0, additionalManagers);
    log('managers to add', managersToAdd);
    additionalManagers -= managersToAdd.length;
    managers.push(...managersToAdd);
  }

  if (additionalManagers > 0) {
    const diff = _lodash.default.difference(Object.keys(config.servers), managers);

    const managersToAdd = diff.splice(0, additionalManagers);
    log('random servers to add', managersToAdd);
    managers.push(...managersToAdd);
  }

  log('desired managers', managers);
  return managers;
}

function findNodes(serverInfo) {
  const nodes = [];
  const managers = currentManagers(serverInfo);

  if (managers.length === 0) {
    return nodes;
  } // TODO: handle nodes that aren't listed in the config.server


  const manager = managers[0];
  const ids = Object.keys(serverInfo).reduce((result, serverName) => {
    if (serverInfo[serverName].swarm) {
      const id = serverInfo[serverName].swarm.NodeID;
      result[id] = serverName;
    }

    return result;
  }, {});
  return serverInfo[manager].swarmNodes.map(node => ids[node.ID]);
}

function nodeIdsToServer(serverInfo) {
  const allIds = [];
  const result = {};
  Object.keys(serverInfo).forEach(host => {
    if (serverInfo[host].swarm) {
      result[serverInfo[host].swarm.NodeID] = host;
    }

    if (serverInfo[host].swarmNodes) {
      const nodes = serverInfo[host].swarmNodes;
      allIds.push(...nodes.map(node => node.ID));
    }
  });
  allIds.forEach(id => {
    if (!(id in result)) {
      // This node isn't listed in config.servers
      result[id] = null;
    }
  });
  return result;
}

function currentLabels(info) {
  const result = {};
  const idToHost = nodeIdsToServer(info);
  Object.keys(info).forEach(host => {
    if (info[host].swarmNodes instanceof Array) {
      info[host].swarmNodes.forEach(node => {
        const nodeHost = idToHost[node.ID]; // Check if it is a server mup has access to

        if (nodeHost === null) {
          return;
        }

        result[nodeHost] = node.Spec.Labels;
      });
    }
  });
  return result;
}

function findClusters(serverInfo) {
  const usedNodeIds = [];
  const clusters = currentManagers(serverInfo).reduce((result, manager) => {
    const {
      swarm,
      swarmNodes
    } = serverInfo[manager];
    const clusterId = swarm.Cluster.ID;

    if (!(clusterId in result)) {
      const managers = swarm.RemoteManagers.map(({
        NodeID
      }) => NodeID);
      const nodes = swarmNodes.map(({
        ID
      }) => ID);
      result[clusterId] = {
        id: clusterId,
        managers,
        nodes
      };
      usedNodeIds.push(...[...managers, ...nodes]);
    }

    return result;
  }, {}); // Nodes not in a swarm cluster have an empty id

  const nodeIds = Object.keys(nodeIdsToServer(serverInfo)).filter(id => id.length > 0);

  const unknownClusterNodes = _lodash.default.difference(nodeIds, usedNodeIds);

  if (unknownClusterNodes.length > 0) {
    clusters['Unknown cluster(s)'] = {
      id: 'Unknown cluster(s)',
      managers: [],
      nodes: unknownClusterNodes
    };
  }

  return clusters;
}

function showClusters(clusters, nodeIds) {
  console.log('');
  console.log('=> List of Swarm Clusters:');
  Object.keys(clusters).forEach(clusterId => {
    const cluster = clusters[clusterId];
    let unknownNodes = 0;
    console.log(` - ID: ${clusterId}`);
    console.log('  - Nodes:');
    cluster.managers.forEach(manager => {
      if (nodeIds[manager]) {
        console.log(`     ${nodeIds[manager]} (manager)`);
      } else {
        unknownNodes += 1;
      }
    });
    cluster.nodes.forEach(node => {
      if (cluster.managers.indexOf(node) > -1) {
        return;
      }

      if (nodeIds[node]) {
        console.log(`     ${nodeIds[node]}`);
      } else {
        unknownNodes = +1;
      }
    });

    if (unknownNodes > 0) {
      console.log(`     Unknown nodes: ${unknownNodes}`);
    }
  });
}
//# sourceMappingURL=swarm-utils.js.map