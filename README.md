# Schema first.™

In our architecture we use Protobuf, _GraphQL or Swagger_ and JSON-Schema to validate the data passed around.

Schemas are defined several times, just to ensure the same validation happen on all endpoints.

This is troublesome, repetitive and boring.

Here we'll explore the idea behind "one schema to rule them all".

## Overview

Sources are Javascript code and JSON-Schema definitions.

```bash
$ git clone git@github.com:agave/models-example.git
$ cd models-example
$ tree src
src
├── api
│   └── models
│       └── Product.js
└── schema
    ├── index.js
    ├── models
    │   ├── Cart
    │   │   ├── Item
    │   │   │   └── schema.json
    │   │   └── schema.json
    │   ├── Product
    │   │   └── schema.json
    │   └── index.js
    └── types
        └── dataTypes.json

8 directories, 7 files
```

## Features*

> Protobuf/GQL definitions are planned to be generated from JSON-Schema too, all contributions are very welcome.

- JSON-Schema is used to generate samples for seeds, fixtures, etc.
- Sequelize models are described by JSON-Schema
- Database migrations are granted for free

## Quick intro

Make sure you ran `npm i` to setup the required dependencies.

1. Run `bin/db migrate --make` to create our initial migrations
2. Run `bin/db migrate --up` to execute those migrations
3. Run `bin/db migrate --apply "initial version"` to take a snapshot

> Snapshots are faster than running all migrations from ground up.

## Testing

A functional test is included, run `node test.js` to see the results.

> As we enhance our JSON-Schema definitions with enough details to be validated we'll be able to generate more accurate data to be tested.

## New models

1. Add your model definitions as `schema.json` files (see the sources)
2. Generate  migrations from schema differences `bin/db migrate --make`
3. Save a snapshot from the whole schema `bin/db migrate --apply "optional description"`

Every time you change something on your `schemas` you MUST repeat the steps 2 and 3, preferably doing fewer changes at once.
