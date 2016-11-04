const fetch = require('node-fetch');
fetch.Promise = require('bluebird');

const url = require('url');
const Property = require('./property');
const Node = require('./node');
const Errors = require('./errors');
const ResponseError = Errors.ResponseError;

const NODES_BASE_PATH = '/nodes/v1';
const PROPERTIES_BASE_PATH = '/properties/v1';
const QUERY_BASE_PATH = '/query/v1';

const DEFAULT_WORKSPACE = 'website';
const DEFAULT_DEPTH = '0';
const DEFAULT_INCLUDE_METADATA = false;
const DEFAULT_EXCLUDE_NODE_TYPES = '';
const DEFAULT_PAGE_TEMPLATE = 'gato-template-txstate2015:pages/standard-template';

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
    workspace: options.workspace || DEFAULT_WORKSPACE,
    depth: options.depth || DEFAULT_DEPTH,
    includeMetadata: options.includeMetadata || DEFAULT_INCLUDE_METADATA,
    excludeNodeTypes: options.excludeNodeTypes || DEFAULT_EXCLUDE_NODE_TYPES,
    pageTemplate: options.pageTemplate || DEFAULT_PAGE_TEMPLATE,
    auth: 'Basic ' + new Buffer(`${options.user}:${options.password}`).toString('base64')
  }
}

function getNodesEndpoint(basePath, workspace, path) {
  let endpoint =  `${basePath}/${NODES_BASE_PATH}/${workspace}/${path}`;
  // Strip extra forward slashes
  return endpoint.replace(/([^:]\/)\/+/g, "$1");
}

function getPropertiesEndpoint(basePath, workspace, path) {
  let endpoint = `${basePath}/${PROPERTIES_BASE_PATH}/${workspace}/${path}`;
  // Strip extra forward slashes
  return endpoint.replace(/([^:]\/)\/+/g, "$1");
}

MagnoliaClient.prototype.getNode = function(path, options) {
  options = options || {};
  let params = {
    depth: options.depth || this._options.depth,
    excludeNodeTypes: options.excludeNodeTypes || this._options.excludeNodeTypes,
    includeMetadata: options.includeMetadata || this._options.includeMetadata
  };
  let endpoint = getNodesEndpoint(this._options.basePath, this._options.workspace, path);
  return fetch(endpoint + url.format({ query: params }), { headers: {authorization: this._options.auth}})
    .then(Errors.checkResponse)
    .then(res => res.json())
    .then(node => Node.fromMagnoliaNode(node));
};

MagnoliaClient.prototype.createNode = function(node) {
  let path = node.path.substr(0, node.path.lastIndexOf('/'));
  let endpoint = getNodesEndpoint(this._options.basePath, this._options.workspace, path);
  return fetch(endpoint, {
    method: 'PUT',
    headers: { authorization: this._options.auth, 'content-type': 'application/json' },
    body: JSON.stringify(node.toMagnoliaNode())
  })
    .then(Errors.checkResponse);
};

MagnoliaClient.prototype.createPage = function(path, template, properties) {
  if (typeof template === 'object') {
    properties = template;
    template = undefined;
  }
  properties = properties || {};
  template = template || this._options.pageTemplate;
  let page = Node.newPage(path, template, properties);

  return this.createNode(page)
    .catch(ResponseError, e => {
      if (e.status !== 404) throw e;

      // 404 means this path's parent hasn't been created yet, so create it
      let parentPath = path.substr(0, path.lastIndexOf('/'));
      return this.createPage(parentPath, template, properties).then(() => this.createPage(path, template, properties));
    })
    .then(() => this.getNode(path))
};

MagnoliaClient.prototype.createArea = function(path) {
  return this.createNode(new Node(path, 'mgnl:area'));
};

MagnoliaClient.prototype.save = function(node) {
  let endpoint = getNodesEndpoint(this._options.basePath, this._options.workspace, node.path);

  return Promise.all([...node._removedProperties].map(name => {
    let propsEndpoint = getPropertiesEndpoint(this._options.basePath, this._options.workspace, node.path + '/' + name);
    return fetch(propsEndpoint, {
      method: 'DELETE',
      headers: { authorization: this._options.auth }
    });
  }))
    .then(() => {
      if (node._hasChangedProps) {
        return fetch(endpoint , {
          method: 'POST',
          headers: { authorization: this._options.auth, 'content-type': 'application/json' },
          body: JSON.stringify(node.toMagnoliaNode())
        });
      }
    });
};

MagnoliaClient.prototype.deleteNode = function(path) {
  let endpoint = getNodesEndpoint(this._options.basePath, this._options.workspace, path);
  return fetch(endpoint, {
    method: 'DELETE',
    headers: { authorization: this._options.auth }
  })
    .then(Errors.checkResponse);
};

module.exports = MagnoliaClient;
