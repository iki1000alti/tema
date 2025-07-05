const express = require('express');
const router = express.Router();
const db = require('../db');

// Tema paletini getir
router.get('/theme', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT data FROM settings WHERE name = 'thema' LIMIT 1");
    if (rows.length === 0) return res.status(404).json({ error: 'Theme not found' });
    res.json(JSON.parse(rows[0].data));
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  }
});

// Tema paletini güncelle (tümünü)
router.put('/theme', async (req, res) => {
  try {
    const newTheme = req.body; // Tüm JSON bekleniyor
    await db.query("UPDATE settings SET data = ? WHERE name = 'thema'", [JSON.stringify(newTheme)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  }
});

module.exports = router; 