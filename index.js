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

Magnolia.prototype.gatoPage = function(path) {
  let page = this.page(path, 'gato-template-txstate2015:pages/standard-template');
  page.addNode(this.node('contentParagraph', 'mgnl:area'))
    .addNode(this.component('0', 'gato-template:components/rows/full'))
      .addNode(this.area('column1'));
  return page;
}

Magnolia.prototype.area = function(path, template) {
  return new types.Area(this.client, path, template);
}

Magnolia.prototype.component = function(path, template) {
  return new types.Component(this.client, path, template);
}

Magnolia.prototype.asset = function(path, options) {
  return new types.Asset(this.client, path, options);
}

Magnolia.prototype.png = function(path, image, buffer) {

}
module.exports = Magnolia;

