require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

app.get('/', (req, res) => {
  res.send('Backend çalışıyor!');
});

// Örnek bir veritabanı sorgusu endpointi
app.get('/users', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Admin tablosu oluşturulmalı: 
// CREATE TABLE admins (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE, password VARCHAR(255));

// Admin kayıt endpointi
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Eksik bilgi' });
  let conn;
  try {
    conn = await pool.getConnection();
    const hash = await bcrypt.hash(password, 10);
    await conn.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hash]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Admin giriş endpointi
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Eksik bilgi' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Şifre yanlış' });
    const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// JWT doğrulama middleware
function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token yok' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Geçersiz token' });
    req.user = user;
    next();
  });
}

// Korunan admin panel endpointi
app.get('/admin-panel', auth, (req, res) => {
  res.json({ message: 'Admin paneline hoş geldin!', user: req.user });
});

app.post('/test', (req, res) => {
  res.json({ message: 'POST çalışıyor', body: req.body });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend ${PORT} portunda çalışıyor.`);
}); 