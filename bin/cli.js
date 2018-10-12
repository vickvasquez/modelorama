'use strict';

const argv = require('wargs')(process.argv.slice(2));
const cmd = argv._.shift();

const USAGE_INFO = `
Perform database changes

  --only       Filter out specific models

  migrate

    --make     Take an snapshot from your models
    --apply    Save changes from executed migrations

    --create   Create database from your schema
    --destroy  Drop the database entirely

    --up       Apply all pending migrations
    --down     Revert all applied migrations
    --next     Apply the latest pending migration
    --prev     Revert the latest applied migration

    --from     Apply migrations from this offset
    --to       Apply migrations up to this offset

  backup

    --import   Load into the database, directory or file
    --export   Save backup to destination, directory

Examples:
  bin/db migrate --make
  bin/db migrate --apply "migration description"
  bin/db backup --load ../from/backup/or/path/to/seeds
  bin/db backup --save path/to/seeds --only Product,Cart

Type 'bin/db config' to display your current database settings
`;

const options = {
  migrations: argv._.slice(),
  options: argv.flags,
};

let _error;
let _conn;
let _cli;
let _db;

function db(cb) {
  if (['migrate', 'backup', 'config'].indexOf(cmd) !== -1) {
    _cli = _cli || require('json-schema-sequelizer/cli');
    _db = _db || require('../src/schema').models.database;

    return cb(_db);
  }
}

function echo(str)  {
  process.stdout.write(str);
}

Promise.resolve()
  .then(() => db(x => x.connect()))
  .then(() => {
    if (cmd === 'migrate' || cmd === 'backup') {
      return db(x => _cli.execute(x, options));
    }

    if (cmd === 'config') {
      return db(x => {
        const opts = x.sequelize.options;

        echo(`# models: ${Object.keys(x.sequelize.models).join(', ')}\n`);
        echo(`# directory: ${opts.directory}\n`);

        if (options.storage) {
          echo(`# storage: ${opts.storage}\n`);
        }

        if (!opts.connection) {
          echo(`# connection: ${opts.dialect} (${opts.host}:${opts.port}) ${opts.database || 'N/A'}\n`);
        } else {
          echo(`# connection: ${opts.connection}\n`);
        }
      });
    }

    process.stderr.write(`${USAGE_INFO}\n`);
    process.exit(1);
  })
  .catch(e => {
    process.stderr.write(`${e.stack}\n`);
    _error = true;
  })
  .then(() => db(x => x.close()))
  .catch(e => {
    process.stderr.write(`${e.stack}\n`);
    _error = true;
  })
  .then(() => {
    if (_error) {
      process.exit(1);
    }
  });
