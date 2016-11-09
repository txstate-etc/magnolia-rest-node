const Magnolia = require('../../index');
const Errors = require('../../lib/errors');
const should = require('should');

const options = {
  basePath: 'http://localhost:8080/.rest',
  user: 'superuser',
  password: 'superuser',
  workspace: 'website',
  depth: 1
};

describe('magnolia-rest', function() {
  this.timeout(5000);

  before(function() {
    this.magnolia = new Magnolia(options);
  });

  describe('node', function() {
    describe('#get', function() {
      it('should return a node', function () {
        return this.magnolia.node('/website/Normal').get()
          .then(node => node.name.should.equal('Normal'));
      });
    });

    describe('#create', function() {
      it('should create a node', function() {
        return this.magnolia.node('/website/test-node', 'mgnl:page').create()
          .then(() => this.magnolia.node('/website/test-node').get())
          .then(node => node.name.should.equal('test-node'));
      });
      it('should create nodes recursively', function() {
        let node = this.magnolia.node('/website/test-recurse', 'mgnl:page');
        node.addNode(this.magnolia.node('contentParagraph', 'mgnl:area'));
        return node.create()
          .then(() => this.magnolia.node('/website/test-recurse/contentParagraph').get())
          .then(node => node.name.should.equal('contentParagraph'));
      });

      after(function() {
        return this.magnolia.node('/website/test-recurse').delete();
      });
    });

    describe('#save', function() {
      it('should update properties', function() {
        return this.magnolia.node('/website/test-node').get()
          .then(node => {
            node.setProperty('test', 'test');
            return node.save();
          })
          .then(() => this.magnolia.node('/website/test-node').get())
          .then(node => {
            node.getProperty('test').should.equal('test');
          });
      });
      it('should delete properties', function() {
        return this.magnolia.node('/website/test-node').get()
          .then(node => {
            node.deleteProperty('test');
            return node.save();
          })
          .then(() => this.magnolia.node('/website/test-node').get())
          .then(node => should(node.getProperty('test')).not.be.ok());
      });
    });

    describe('#delete', function() {
      it('should delete node', function() {
        return this.magnolia.node('/website/test-node').delete()
          .then(() => this.magnolia.node('website/test-node').get())
          .then(() => { throw 'Expected 404' })
          .catch(e => e.should.be.an.instanceOf(Errors.ResponseError).and.have.property('status', 404));
      });
    });
  });

  describe('page', function() {
    it('should automatically create missing parent pages', function() {
      let page = this.magnolia.page('/website/parents/dont/exist', 'gato-template-txstate2015:pages/standard-template');
      return page.create()
        .then(() => this.magnolia.node('/website/parents/dont/exist').get())
        .then(node => node.name.should.equal('exist'));
    });

    after(function() {
      return this.magnolia.node('/website/parents').delete();
    });
  });
});
