## Features

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

## Usage

1. Add your model definitions as `.json` files
2. Generate  migrations from schema differences `bin/db migrate --make`
3. Save a snapshot from the whole schema `bin/db migrate --apply "optional description"`

Every time you change something on your models you MUST repeat the steps 2 and 3, preferrably doing fewer changes at once.
