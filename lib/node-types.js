const Node = require('./node');

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

module.exports = {
  Component: Component,
  Area: Area,
  Page: Page
};
