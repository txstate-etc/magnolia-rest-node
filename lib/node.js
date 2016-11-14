const Property = require('./property');
const DEFAULT_WORKSPACE = 'website';

/**
 * Object to make nodes easier to work with.
 *
 * @param {string} path - Repository path
 * @param {string} type - Node type, e.g. 'mgnl:page'
 * @param {object} properties - Properties to be added to the node. Default: {}
 * @constructor
 */
function Node(client, path, type) {
  this.client = client;
  this.path = path;
  this.type = type;
  this._properties = {};
  this.nodes = {};
  this._removedProperties = new Set();
  this._changedProps = new Set();
}

Node.prototype = {
  get template() {
    return this.getProperty('mgnl:template');
  },
  set template(template) {
    this.setProperty('mgnl:template', template);
  },

  set path(path) {
    this._path = path;
    this.name = path.slice(path.lastIndexOf('/') + 1);
    this.workspace = path.slice(1, path.indexOf('/', 1));
  },
  get path() {
    return this._path;
  },
  get parentPath() {
    return this.path.substr(0, this.path.lastIndexOf('/'));
  },

  get nodesArray() {
    let ret = [];
    for (name in this.nodes) {
      ret.push(this.nodes[name]);
    }
    return ret;
  }
};

Node.prototype.get = function(opts) {
  return this.client.getNode(this, opts);
};

Node.prototype.create = function(parentProto) {
  return this.client.create(this, parentProto);
}

Node.prototype.save = function() {
  return this.client.save(this);
}

Node.prototype.delete = function() {
  return this.client.deleteNode(this.path);
}

Node.prototype.getProperty = function(name) {
  return this._properties[name] ? this._properties[name].value : null;
};

Node.prototype.setProperty = function(name, prop, type) {
  if (typeof prop === 'undefined' || prop === null) {
    return this.deleteProperty(name);
  }
  if (!(prop instanceof Property)) {
    prop = new Property(name, prop, type);
  }
  this._properties[prop.name] = prop;
  this._removedProperties.delete(name);
  this._changedProps.add(name);
};

Node.prototype.setProperties = function(props) {
  if (props instanceof Array) {
    props.forEach(prop => {
      if (!(prop instanceof Property)) throw new Error('all elements of props must be instance of Property');
      this._properties[prop.name] = prop;
      this._changedProps.add(name);
    });
    return;
  }
  if (typeof props !== 'object') throw new Error('props must be an array or object');

  for (let name in props) {
    let prop = props[name];
    if (!(prop instanceof Property)) {
      prop = new Property(name, prop);
    }
    this._properties[name] = prop;
    this._changedProps.add(name);
  }
};

Node.prototype.deleteProperty = function(name) {
  if (this._properties[name]) {
    delete this._properties[name];
    this._removedProperties.add(name);
    this._changedProps.delete(name);
  }
};

Node.prototype.clone = function() {
  let node = new Node(this.client, this.path, this.type);
  node.setProperties(this._properties);
  return node;
}

/**
 * Create a node from a Magnolia API response.
 *
 * Node JSON Schema from Magnolia API Swagger:
 *
 * "node": {
 *   "id": "node",
 *   "properties": {
 *     "name": {
 *       "type": "string"
 *     },
 *     "properties": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "property"
 *       }
 *     },
 *     "type": {
 *       "type": "string"
 *     },
 *     "path": {
 *       "type": "string"
 *     },
 *     "nodes": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "node"
 *       }
 *     },
 *     "identifier": {
 *       "type": "string"
 *     }
 *   }
 * }
 *
 * @param {{name: *, identifier: *, type: *, path: *, properties: Array, nodes: Array}} magnoliaNode - Node object returned from Magnolia API.
 * @returns {Node}
 */
Node.prototype.loadMagnoliaNode = function(magnoliaNode) {
  this.type = magnoliaNode.type;
  this.identifier = magnoliaNode.identifier;
  this._properties = {};

  magnoliaNode.properties.forEach(p => {
    this._properties[p.name] = Property.fromMagnoliaProperty(p);
  });
  this.nodes = {};
  if (magnoliaNode.nodes) {
    magnoliaNode.nodes.forEach(n => {
      let child = new Node(this.client, this.path + '/' + n.name, n.type);
      this.addNode(child.loadMagnoliaNode(n));
    });
  }
  return this;
};

Node.prototype.addNode = function(node) {
  node.path = `${this.path}/${node.name}`;
  this.nodes[node.name] = node;
  node.parent = this;
  return node;
};

Node.prototype.down = function(path) {
  return path.split('/').reduce((node, name) => node ? node.nodes[name] : node, this);
}

Node.prototype.up = function() {
  if (!this.parent) {
    this.parent = new Node(this.client, this.parentPath);
  }
  return this.parent;
}

/**
 *
 * @returns {{name: *, type: *, properties: Array}}
 */
Node.prototype.toMagnoliaNode = function() {
  let node = {
    name: this.name,
    type: this.type,
    properties: []
  };
  [...this._changedProps].forEach(name => node.properties.push(this._properties[name].toMagnoliaProperty()));
  return node;
};

module.exports = Node;
