const MagnoliaRest = require('../../index');
const Magnolia = MagnoliaRest.Client;
const Errors = require('../../lib/errors');
const should = require('should');

const options = {
  basePath: 'http://localhost:8080/.rest',
  user: 'superuser',
  password: 'superuser',
  depth: 1
};

describe('magnolia-rest', function() {
  this.timeout(5000);

  before(function() {
    this.client = new Magnolia(options);
  });

  describe('#getNode', function() {
    it('should return a page', function() {
      return this.client.getNode('Normal', {depth: 0})
        .then(node => {
          console.dir(node);
          console.dir(node.toMagnoliaNode());
        });
    });
  });

  describe('#createPage', function() {
    it('should create and return a page', function() {
      return this.client.createPage('/test-page')
        .then(node => console.dir(node.toMagnoliaNode()));
    });

    it('should automatically create missing parent pages', function() {
      return this.client.createPage('/parents/dont/exist')
        .then(node => console.dir(node));
    });
  });

  describe('#save', function() {
    it('should update properties', function() {
      return this.client.getNode('/test-page')
        .then(node => {
          node.setProperty('testProp', 'this is a test');
          return this.client.save(node);
        })
        .then(() => this.client.getNode('/test-page'))
        .then(node => node.getProperty('testProp').should.equal('this is a test'));
    });
    it('should delete properties', function() {
      return this.client.getNode('/test-page')
        .then(node => {
          node.deleteProperty('testProp');
          return this.client.save(node);
        })
        .then(() => this.client.getNode('/test-page'))
        .then(node => should(node.getProperty('testProp')).not.be.ok());
    });
  });

  describe('#deleteNode', function() {
    it('should delete node', function() {
      return this.client.deleteNode('/test-page')
        .then(() => this.client.getNode('/test-page'))
        .then(() => { throw 'Expected 404' })
        .catch(e => {
          e.should.be.an.instanceOf(Errors.ResponseError).and.have.property('status', 404);
        });
    });
  });

  after(function() {
    return this.client.deleteNode('/parents');
  });
});
