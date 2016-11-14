const Promise = require('bluebird');
const fetch = require('node-fetch');
fetch.Promise = Promise;

const url = require('url');
const Node = require('./node');
const Errors = require('./errors');
const ResponseError = Errors.ResponseError;

const NODES_BASE_PATH = '/nodes/v1';
const PROPERTIES_BASE_PATH = '/properties/v1';
const DEFAULT_DEPTH = '0';
const DEFAULT_INCLUDE_METADATA = true;
const DEFAULT_EXCLUDE_NODE_TYPES = '';

function MagnoliaClient(options) {
  if (typeof options.basePath !== 'string') {
    throw new Error('options.basePath must be a string, e.g. https://gato-edit.its.txstate.edu/.rest');
  }
  if (typeof options.user !== 'string') {
    throw new Error('options.user must be a string');
  }
  if (typeof options.password !== 'string') {
    throw new Error('options.password must be a string');
  }

  this._options = {
    basePath: options.basePath,
    depth: options.depth || DEFAULT_DEPTH,
    includeMetadata: options.includeMetadata || DEFAULT_INCLUDE_METADATA,
    excludeNodeTypes: options.excludeNodeTypes || DEFAULT_EXCLUDE_NODE_TYPES,
    auth: 'Basic ' + new Buffer(`${options.user}:${options.password}`).toString('base64')
  }
}

function getNodesEndpoint(basePath, path) {
  let endpoint =  `${basePath}/${NODES_BASE_PATH}/${path}`;
  // Strip extra forward slashes
  return endpoint.replace(/([^:]\/)\/+/g, "$1");
}

function getPropertiesEndpoint(basePath, path) {
  let endpoint = `${basePath}/${PROPERTIES_BASE_PATH}/${path}`;
  // Strip extra forward slashes
  return endpoint.replace(/([^:]\/)\/+/g, "$1");
}

MagnoliaClient.prototype.getNode = function(node, options) {
  options = options || {};
  let params = {
    depth: options.depth || this._options.depth,
    excludeNodeTypes: options.excludeNodeTypes || this._options.excludeNodeTypes,
    includeMetadata: options.includeMetadata || this._options.includeMetadata
  };
  let endpoint = getNodesEndpoint(this._options.basePath, node.path);
  console.log('GET ' + endpoint);
  return fetch(endpoint + url.format({ query: params }), { headers: {authorization: this._options.auth}})
    .then(Errors.checkResponse)
    .then(res => res.json())
    .then(magNode => node.loadMagnoliaNode(magNode));
};

MagnoliaClient.prototype.create = function(node, parentProto) {
  let endpoint = getNodesEndpoint(this._options.basePath, node.parentPath);
  console.log('PUT ' + endpoint);
  return fetch(endpoint, {
    method: 'PUT',
    headers: { authorization: this._options.auth, 'content-type': 'application/json' },
    body: JSON.stringify(node.toMagnoliaNode())
  })
    .then(Errors.checkResponse)
    .catch(ResponseError, e => {
      if (!(parentProto instanceof Node) || e.status !== 404) throw e;
      return this.createMissingParents(node, parentProto);
    })
    .then(() => Promise.map(node.nodesArray, n => this.create(n)))
};

MagnoliaClient.prototype.createMissingParents = function(node, parentProto) {
  let depth = node.path.match(/\//g).length - 1;
  let nodesToCreate = node.path.split('/');
  nodesToCreate.shift();
  let root = '/' + nodesToCreate.shift();
  let rootNode = new Node(this, root + '/' + nodesToCreate[0]);
  return rootNode.get({ depth: depth })
    .catch(ResponseError, e => {
      if (e.status !== 404) throw e;
    })
    .then(node => {
      return Promise.reduce(nodesToCreate, (current, name) => {
        let path = current.path + '/' + name;
        if (current.node) {
          return { path: path, node: current.nodes[name] };
        }
        if (current.path === path) {
          return this.create(node);
        }
        let parent = parentProto.clone();
        parent.path = path;
        return this.create(parent).then(() => {
          return { path: path };
        });
      }, { path: root, node: node });
    });
}

MagnoliaClient.prototype.save = function(node) {
  let endpoint = getNodesEndpoint(this._options.basePath, node.path);
  return Promise.map([...node._removedProperties], name => {
    let propsEndpoint = getPropertiesEndpoint(this._options.basePath, node.path + '/' + name);
    console.log('DELETE ' + propsEndpoint);
    return fetch(propsEndpoint, {
      method: 'DELETE',
      headers: { authorization: this._options.auth }
    });
  })
    .then(() => {
      if (node._changedProps.size) {
        console.log('POST ' + endpoint);
        return fetch(endpoint , {
          method: 'POST',
          headers: { authorization: this._options.auth, 'content-type': 'application/json' },
          body: JSON.stringify(node.toMagnoliaNode())
        });
      }
    })
    .then(() => Promise.map(node.nodesArray, n => this.save(n)));
};

MagnoliaClient.prototype.deleteNode = function(path) {
  let endpoint = getNodesEndpoint(this._options.basePath, path);
  console.log('DELETE ' + endpoint);
  return fetch(endpoint, {
    method: 'DELETE',
    headers: { authorization: this._options.auth }
  })
    .then(Errors.checkResponse);
};

module.exports = MagnoliaClient;
