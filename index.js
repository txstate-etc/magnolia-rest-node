const Promise = require("bluebird");
const Client = require('./lib/client');
const Node = require('./lib/node');
const types = require('./lib/node-types');

function Magnolia(options) {
  this.client = new Client(options);
}

Magnolia.prototype.node = function(path, type) {
  return new Node(this.client, path, type);
}

Magnolia.prototype.page = function(path, template) {
  return new types.Page(this.client, path, template);
}

Magnolia.prototype.area = function(path, template) {
  return new types.Area(this.client, path, template);
}

Magnolia.prototype.component = function(path, template) {
  return new types.Component(this.client, path, template);
}

module.exports = Magnolia;
