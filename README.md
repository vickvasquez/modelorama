
# Schema first.™

In our architecture we use Protobuf, _GraphQL or Swagger_ and JSON-Schema to validate the data passed around.

Schemas are defined several times, just to ensure the same validation happen on all endpoints.

This is troublesome, repetitive and boring.

## What's all of this?

Here we'll explore the idea behind "one schema to rule them all".

JSON-Schema is a reusable definition that can be used to describe and validate simple objects.

- The core piece is `json-schema-sequelizer`, which turns schemas into model definitions.
- Used schemas are given to `json-schema-faker` for producing samples, and `is-my-json-valid` helps out to ensure everything is well formed.
- The module `jsonschema-form-mw` included by `app.js` provides an experimental RESTful scaffolding based on `json-schema-sequelizer` models.
- Also, thanks to the newly added `json-schema-to` is possible to generate Protobuf and GraphQL definitions from the same JSON-Schema!

> Scaffolding is still in development stage, any improvement here is appreciated!

## Overview

Sources are Javascript code and JSON-Schema definitions.

```bash
$ git clone git@github.com:pateketrueke/modelorama.git
$ cd modelorama
$ tree src
src
├── api
│   └── models
│       └── Product.js
└── schema
    ├── index.js
    ├── models
    │   ├── Cart
    │   │   ├── Item
    │   │   │   ├── attributes.json
    │   │   │   ├── schema.json
    │   │   │   └── uiSchema.json
    │   │   ├── attributes.json
    │   │   ├── schema.json
    │   │   └── uiSchema.json
    │   ├── Product
    │   │   ├── attributes.json
    │   │   ├── schema.json
    │   │   └── uiSchema.json
    │   └── index.js
    └── types
        └── dataTypes.json

8 directories, 13 files
```

## Features*

> Protobuf/GQL definitions are under development (see [json-schema-to](https://github.com/pateketrueke/json-schema-to)), all contributions are very welcome.

- JSON-Schema is used to generate samples for seeds, fixtures, etc.
- Sequelize models are described by JSON-Schema
- Database migrations are granted for free
- Scaffolding for basic RESTful-ops

## Quick intro

Make sure you ran `npm i` to setup the required dependencies.

1. Run `make prune` and then `make migration` to setup the database

## Protobuf / GraphQL

1. Run `node schema.js` and see [how it works](https://github.com/pateketrueke/modelorama/blob/master/schema.js)

## Testing

A functional test is included, run `node test.js` to see the results.

> As we enhance our JSON-Schema definitions with enough details to be validated we'll be able to generate more accurate data to be tested.

## Migrations

In order to apply the migrations you must:

1. Run `bin/db migrate --make` to create our initial migrations
2. Run `bin/db migrate --up` to execute those migrations
3. Run `bin/db migrate --apply "initial version"` to take a snapshot

> Snapshots are faster than running all migrations from ground up.

### New models

1. Add your model definitions as `schema.json` files (see the sources)
2. Generate  migrations from schema differences `bin/db migrate --make`
3. Save a snapshot from the whole schema `bin/db migrate --apply "optional description"`

Every time you change something on your `schemas` you MUST repeat the steps 2 and 3, preferably doing fewer changes at once.
