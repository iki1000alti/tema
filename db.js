const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'administ', // burayı değiştir
  password: '@Q475kbq2',     // burayı değiştir
  database: 'admin_db', // burayı değiştir
  connectionLimit: 5
});
module.exports = pool; 