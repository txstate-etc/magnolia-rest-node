# Javascript client for the Magnolia CMS REST API

## Installation

`npm install https://github.com/txstate-etc/magnolia-rest-node`

## Getting started

Before using this library, make sure you have a system user with the permissions outlined on this page: https://documentation.magnolia-cms.com/display/DOCS/REST+API#RESTAPI-Authenticating.

Instantiate a new client with the desired configuration. The following options can be passed to the constructor:

- `basePath` - path to .rest (magnolia-edit-url/.rest)
- `user` - name of the user to use for authorization (must be a system user)
- `password` - the user's password
- `depth` - tree depth for nodes that are retrieved via the API (1 = just the node, 2 = node + children, 3 = node + children + grandchildren, etc.)
- `includeMetaData` - whether or not to include metadata nodes and properties (e.g. mgnl:* and jcr:* properties)
- `excludeNodeTypes` - comma-separated list of node types that shouldn't be returned


```
let MagnoliaRest = require('magnolia-rest');
let magnolia = new MagnoliaRest({
  basePath: 'http://localhost:8080/.rest',
  user: 'superuser',
  password: 'superuser',
  depth: 1,
  includeMetaData: true,
  excludeNodeTypes: ''
});
```


### Retrieving nodes

The `magnolia.node` function creates a local representation of a JCR node stored in Magnolia. Use `node.get` to populate the node with data retrieved from Magnolia.

`magnolia.node('/website/page').get().then(console.dir);`

### Creating nodes

There are convenience methods to quickly create nodes of different types.

```
let page = magnolia.page('/website/parent/new-page', 'gato-template-txstate2015:pages/standard-template');
page.addNode(this.node('contentParagraph', 'mgnl:area'))
  .addNode(this.component('0', 'gato-template:components/rows/full'))
  .addNode(this.area('column1'));
  
page.create()
    .then(() => magnolia.node('/website/parent/new-page').get({ depth: 4 })
    .then(console.dir);
```

See the API reference for a complete list and description of types.

### Updating properties

Set or remove node properties using `node.save`.

```
let page = magnolia.page('/website/page');
page.get()
  .then(() => {
    page.setProperty('title', 'Page Title');
    page.deleteProperty('propName');
    return page.save();
  });
```

### Deleting nodes

Delete a node with `node.delete`.

`magnolia.node('/website/page').delete()`
