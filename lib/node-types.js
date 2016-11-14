const Node = require('./node');
const Property = require('./property');

function Page(client, path, template) {
  Node.call(this, client, path, 'mgnl:page');
  this.template = template;
}
Page.prototype = Object.create(Node.prototype);
Page.prototype.constructor = Page;
Page.prototype.create = function() {
  return Node.prototype.create.call(this, new Page(this.client, '', this.template));
}

function Area(client, path, template) {
  Node.call(this, client, path, 'mgnl:area');
  this.template = template;
}
Area.prototype = Object.create(Node.prototype);
Area.prototype.constructor = Area;

function Component(client, path, template) {
  Node.call(this, client, path, 'mgnl:component');
  this.template = template;
}
Component.prototype = Object.create(Node.prototype);
Component.prototype.constructor = Component;

function Asset(client, path, options) {
  Node.call(this, client, path, 'mgnl:asset');
  console.log(options);
  this.setProperty('type', options.type);

  let contentProps = {
    'jcr:data': new Property('jcr:data', options.data.toString('base64'), 'Binary'),
    'jcr:mimeType': options.mimeType
  };
  let content = new Node(client, 'jcr:content', 'mgnl:resource');
  content.setProperties(contentProps);
  this.addNode(content);
  this.fileName = options.fileName;
}
Asset.prototype = Object.create(Node.prototype);
Asset.prototype.constructor = Asset;

Asset.prototype.create = function() {
  return Node.prototype.create.call(this, new Node(this.client, '', 'mgnl:folder'));
}

Object.defineProperty(Asset.prototype, 'extension', {
  get: function() {
    return this.nodes['jcr:content'].getProperty('extension');
  },
  set: function(extension) {
    this.nodes['jcr:content'].setProperty('extension', extension);
  }
});

Object.defineProperty(Asset.prototype, 'fileName', {
  get: function() {
    return this.nodes['jcr:content'].getProperty('fileName');
  },
  set: function(fileName) {
    this.nodes['jcr:content'].setProperty('fileName', fileName);
    if (fileName.indexOf('.') > 0) {
      this.extension = fileName.slice(fileName.lastIndexOf('.') + 1);
    }
  }
});

Asset.prototype.getUuidLink = function() {
  return `/${this.workspace}/jcr:${this.identifier}`;
};

module.exports = {
  Component: Component,
  Area: Area,
  Page: Page,
  Asset: Asset
};
