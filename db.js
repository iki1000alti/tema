const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'KULLANICI_ADI', // burayı değiştir
  password: 'SIFRE',     // burayı değiştir
  database: 'VERITABANI_ADI', // burayı değiştir
});
module.exports = pool; 