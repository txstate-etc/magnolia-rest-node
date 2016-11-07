const Property = require('./property');
const DEFAULT_PAGE_TEMPLATE = 'gato-template-txstate2015:pages/standard-template';

/**
 * Object to make nodes easier to work with. Node JSON Schema:
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
 * @param magnoliaNode
 * @constructor
 */
function Node(path, type, properties) {
  this.type = type;
  this.name = path.slice(path.lastIndexOf('/')+1);
  this.path = path;
  this._properties = properties || {};
  this.nodes = [];
  this._isNew = true;
}

Node.prototype._removedProperties = new Set();
Node.prototype._hasChangedProps = false;
Node.prototype._isNew = false;

Node.newPage = function(path, template, properties) {
  template = template || DEFAULT_PAGE_TEMPLATE;
  properties = properties || {};
  properties['mgnl:template'] = new Property('mgnl:template', template);
  return new Node(path, 'mgnl:page', properties);
};

Node.newArea = function(path, template, properties) {
  if (typeof template === 'object') {
    properties = template;
  }
  properties = properties || {};
  if (template) {
    properties['mgnl:template'] = new Property('mgnl:template', template);
  }
  return new Node(path, 'mgnl:area', properties);
};

Node.newComponent = function(path, template, properties) {
  if (typeof template === 'object') {
    properties = template;
  }
  properties = properties || {};
  if (template) {
    properties['mgnl:template'] = new Property('mgnl:template', template);
  }
  return new Node(path, 'mgnl:component', properties);
};

Node.fromMagnoliaNode = function(magnoliaNode) {
  let node = Object.create(Node.prototype);
  node.name = magnoliaNode.name;
  node.type = magnoliaNode.type;
  node.path = magnoliaNode.path;
  node.identifier = magnoliaNode.identifier;
  node._properties = {};

  magnoliaNode.properties.forEach(p => {
    node._properties[p.name] = Property.fromMagnoliaProperty(p);
  });
  node.nodes = [];
  if (magnoliaNode.nodes) {
    node.nodes = magnoliaNode.nodes.map(n => Node.fromMagnoliaNode(n));
  }
  return node;
};

Node.prototype.setProperty = function(name, value, type) {
  let prop = new Property(name, value, type);
  this._properties[name] = prop;
  this._removedProperties.delete(name);
  this._hasChangedProps = true;
};

Node.prototype.getProperty = function(name) {
  return this._properties[name] ? this._properties[name].value : null;
};

Node.prototype.deleteProperty = function(name) {
  if (this._properties[name]) {
    delete this._properties[name];
    this._removedProperties.add(name);
  }
};

Node.prototype.toMagnoliaNode = function() {
  let node = {
    name: this.name,
    identifier: this.identifier,
    type: this.type,
    path: this.path,
    properties: [],
    nodes: []
  };
  for (name in this._properties) {
    node.properties.push(this._properties[name].toMagnoliaProperty());
  }
  return node;
};

module.exports = Node;
