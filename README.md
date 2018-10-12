Modelorama showcases Protobuf, GraphQL and JSON-Schema cooperating to achieve a solid service-based architecture for web applications.

The front-end API is built on GraphQL, communication between back-end services is done with gRPC.

The database is built on top of Sequelize, also powered by JSON-Schema.

# Table of contents

- [How it works?](#how-it-works)
- [Tools used](#tools-used)
- [Quick start](#quick-start)
  - [GraphQL](#graphql)
  - [Models](#models)
  - [Migrations](#migrations)

## How it works?

&mdash; **Types** are declared by JSON-Schema:

```json
{
  "id": "Example",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  },
  "required": ["name"]
}
```

This can be traduced to GraphQL:

```graphql
type Example {
  name: String!
}
```

Protobuf can be generated the same way:

```protobuf
message Example {
  required string name = 1;
}
```

All this means:

- GraphQL and Protobuf can be used to validate shape and types on any message being transmitted.
- JSON-Schema can be used to validate format, content and advanced relationships of the data itself.

> JSON-Schema helps where GraphQL/Protobuf slacks off.

&mdash; **Services** are described using JSON-Schema too:

```yaml
id: Test

service:
  calls:
  - get: example
    resp: Example
  - get: examples
    resp: ExampleList

definitions:
  Example: !include schema.json
  ExampleList:
    type: array
    items:
      $ref: Example
```

> We're using YAML here for brevity, so both formats are supported.

Now we can generate a working GraphQL schema:

```graphql
extend type Query {
  example: Example
  examples: [Example]
}
type Example {
  name: String!
}
```

With its corresponding Protobuf service definition:

```protobuf
syntax = "proto3";
package test;
service TestService {
  rpc example(Noop) returns(Example);
  rpc examples(Noop) returns(ExampleList);
}
message Noop {
}
message Example {
  required string name = 1;
}
message ExampleList {
  repeated Example data = 1;
}
```

Once all definitions are generated we can export them to be consumed by several services in different technologies.

> Here we'll be using plain Javascript objects or modules to shape our controllers or handlers.

&mdash; **Controllers** are object definitions or classes matching the shape of declared service calls.

E.g. `Test.example` and `Test.examples` should be callable methods:

```js
module.exports = {
  example() {},
  examples() {},
};
```

## Tools used

JSON-Schema is required, hence, to build several stuff:

- [json-schema-to](https://www.npmjs.com/package/json-schema-to) &mdash; generate GraphQL/Protobuf definitions
- [json-schema-faker](https://www.npmjs.com/package/json-schema-faker) &mdash; produce random samples
- [json-schema-sequelizer](https://www.npmjs.com/package/json-schema-sequelizer) &mdash; define models and its migrations

For the application logic and tooling we're using:

- [graphql](https://www.npmjs.com/package/graphql), [graphl-tools](https://www.npmjs.com/package/graphql-tools) &mdash; for the front-end API
- [grpc](https://www.npmjs.com/package/grpc), [@grpc/proto-loader](https://www.npmjs.com/package/@grpc/proto-loader) &mdash; between-services gateway
- [express](https://www.npmjs.com/package/body-parser),  [body-parser](https://www.npmjs.com/package/express) &mdash; web-server with `application/json` support
- [sastre](https://www.npmjs.com/package/sastre) &mdash; to compose Javascript modules as GraphQL/gRPC handlers
- [wargs](https://www.npmjs.com/package/wargs) &mdash; CLI parser for `bin/db` binary, use for migrations and such
- [sqlite3](https://www.npmjs.com/package/sqlite3) &mdash; light-weight database, used by Sequelize
- [nodemon](https://www.npmjs.com/package/nodemon) &mdash; watch sources and reload, for development

## Quick start

Clone this repo quickly with `degit`:

```bash
$ npx degit agave/modelorama my-project
$ cd my-project
$ npm ci
```

- Run `make build` to generate the schemas.
- Run `make prune` and then `make migration` to setup the database.

> To display all available tasks just run `make` without arguments.

Optionally, you can execute `node test.js` to sync and populate the database.

### GraphQL

Run `npm start` to start the API:

```
GraphQL: http://localhost:8081/api (2.686ms)
```

Make a GraphQL request (`GET` is supported):

```bash
$ http 'localhost:8081/api?body=query{products{id,name}}'
```

> Here we're using [httpie](https://httpie.org/) to make the requests.

GraphQL handlers or resolvers can talk to other services through gRPC calls.

&mdash; See the [web-server](/app.js), [graphql](/src/helpers/graphql.js) and [gateway](/src/helpers/grpc.js) implementations.

### Models

Adding new types to the system mandate three details:

- Model/JSON-Schema definition at `src/schema/models`
- GraphQL resolver at `src/schema/graphql`
- gRPC handler at `src/schema/controllers`

Run `make gen model=Example` to generate these files and tweak as you need.

> To get rid of generated files you can execute `make undo model=Example` to remove them.

&mdash; See the [models](/src/helpers/models.js) implementation.

Handlers can receive their dependencies by using `provider.js` modules, they works perfectly on models and controllers.

&mdash; Please [read the sources](/src/schema) to get a better picture.

### Migrations

> Always review the generated code twice and tweak until it matches your needs before commiting.

Now, in order to migrate the database you MUST:

1. Run `bin/db migrate --make` to create our initial migrations
2. Run `bin/db migrate --up` to execute those migrations
3. Run `bin/db migrate --apply "initial version"` to take a snapshot

Run `git commit` to keep your changes, or `make prune` to discard them.

> Every modification on the schemas MUST be reflected by repeating the steps described above to ensure atomic changes over time.

The `db/schema.js` file is a single-shot migration or snapshot from the current database state.

> Snapshots are faster than running all migrations from ground up.
