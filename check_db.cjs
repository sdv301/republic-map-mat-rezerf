const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

db.serialize(() => {
  db.each("SELECT name FROM sqlite_master WHERE type='table'", (err, table) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Table:', table.name);
  });

  db.get("SELECT count(*) as count FROM districts", (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Districts count:', row.count);
    }
  });
});

db.close();

