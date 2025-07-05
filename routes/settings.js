const express = require('express');
const router = express.Router();
const db = require('../db');

// Tema paletini getir
router.get('/theme', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const rows = await conn.query("SELECT data FROM settings WHERE name = 'thema' LIMIT 1");
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Theme not found' });
    // mariadb'de query sonucu son satırda meta-data olabilir, onu ayıkla
    const dataRow = rows[0].data ? rows[0] : rows[0];
    res.json(JSON.parse(dataRow.data));
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Tema paletini güncelle (tümünü)
router.put('/theme', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.query("UPDATE settings SET data = ? WHERE name = 'thema'", [JSON.stringify(req.body)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router; 