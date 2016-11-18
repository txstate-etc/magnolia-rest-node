const Promise = require("bluebird");
const Client = require('./lib/client');
const Node = require('./lib/node');
const types = require('./lib/node-types');
const fs = Promise.promisifyAll(require('fs'));
const lwip = Promise.promisifyAll(require('lwip'));

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

Magnolia.prototype.image = function(path, file, type) {
  if (!type) {
    type = file.slice(file.lastIndexOf('.') + 1);
  }
  let buffer, size;
  return fs.readFileAsync(file)
    .then(b => {
      buffer = b;
    })
    .then(() => fs.statAsync(file))
    .then(stats => {
      size = stats.size;
      return lwip.openAsync(file, type);
    })
    .then(image => {
      let asset = this.asset(path, {
        type: type,
        fileName: file,
        mimeType: `image/${type}`,
        data: buffer
      });
      asset.down('jcr:content').setProperties({
        width: image.width(),
        height: image.height(),
        size: size
      });
      return asset;
    });
}
module.exports = Magnolia;

