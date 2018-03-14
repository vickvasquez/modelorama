## How it works?

- JSON-Schema is used to generate samples for seeds, fixtures, etc.
- Sequelize models are described by JSON-Schema.
- Database migrations are granted for free.

## Overview

```bash
$ git clone git@github.com:agave/models-example.git
$ cd models-example
$ tree src
src
├── api
│   └── models
│       └── Product.js
└── models
    ├── definitions
    │   └── dataTypes.json
    ├── index.js
    ├── schema.js
    └── schemas
        ├── Cart.json
        ├── CartItem.json
        └── Product.json

5 directories, 7 files
```

## Migrations

```bash
$ bin/migrate make
$ bin/migrate apply
$ bin/migrate create
$ bin/migrate destroy
$ bin/migrate up
$ bin/migrate down
$ bin/migrate next
$ bin/migrate prev
```
