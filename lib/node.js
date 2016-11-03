const Property = require('./property');

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
  this.properties = properties || {};
  this.nodes = [];
}

Node.newPage = function(path, template, properties) {
  properties = properties || {};
  properties['mgnl:template'] = new Property('mgnl:template', template);
  return new Node(path, 'mgnl:page', properties);
};

Node.fromMagnoliaNode = function(magnoliaNode) {
  let node = Object.create(Node.prototype);
  node.name = magnoliaNode.name;
  node.type = magnoliaNode.type;
  node.path = magnoliaNode.path;
  node.identifier = magnoliaNode.identifier;
  node.properties = {};

  magnoliaNode.properties.forEach(p => {
    node.properties[p.name] = Property.fromMagnoliaProperty(p);
  });
  node.nodes = [];
  if (magnoliaNode.nodes) {
    node.nodes = magnoliaNode.nodes.map(n => Node.fromMagnoliaNode(n));
  }
  return node;
};

Node.prototype.toMagnoliaNode = function() {
  let node = {
    name: this.name,
    identifier: this.identifier,
    type: this.type,
    path: this.path,
    properties: [],
    nodes: this.nodes.map(n => n.toMagnoliaNode())
  };
  for (name in this.properties) {
    node.properties.push(this.properties[name].toMagnoliaProperty());
  }
  return node;
};

module.exports = Node;
