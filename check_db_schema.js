/* eslint-disable no-console */

const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || 'patient_database.db';

function openDb(path) {
  return new sqlite3.Database(path);
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function main() {
  const db = openDb(DB_PATH);

  try {
    await get(db, 'PRAGMA foreign_keys = ON');

    const v = await get(db, 'select sqlite_version() as v');
    console.log('SQLITE_VERSION', v?.v);

    console.log('\nPRAGMA integrity_check');
    console.log(await all(db, 'PRAGMA integrity_check'));

    console.log('\nPRAGMA foreign_key_check');
    console.log(await all(db, 'PRAGMA foreign_key_check'));

    const tables = await all(
      db,
      "select name, sql from sqlite_master where type='table' and name not like 'sqlite_%' order by name"
    );

    console.log('\nTABLES', tables.map((t) => t.name));

    for (const t of tables) {
      console.log(`\n== ${t.name} ==`);
      console.log(t.sql);
      console.log('COLUMNS', await all(db, `PRAGMA table_info(\"${t.name}\")`));
      console.log('FOREIGN_KEYS', await all(db, `PRAGMA foreign_key_list(\"${t.name}\")`));
      console.log('INDEXES', await all(db, `PRAGMA index_list(\"${t.name}\")`));
    }
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
