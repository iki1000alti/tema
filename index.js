require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB bağlantısı başarılı!');
}).catch(err => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Tema ayarları modeli
const settingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
});
const Setting = mongoose.model('Setting', settingSchema);

// Kullanıcı modeli
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// Tema paletini getir
app.get('/api/settings/theme', async (req, res) => {
  try {
    const setting = await Setting.findOne({ name: 'theme' });
    if (!setting) return res.status(404).json({ error: 'Theme not found' });
    res.json(setting.data);
  } catch (err) {
    console.error('MongoDB hata:', err);
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  }
});

// Tema paletini güncelle
app.put('/api/settings/theme', async (req, res) => {
  try {
    const updated = await Setting.findOneAndUpdate(
      { name: 'theme' },
      { data: req.body },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated.data });
  } catch (err) {
    console.error('MongoDB hata:', err);
    res.status(500).json({ error: 'Veritabanı hatası', details: err.message });
  }
});

// Kullanıcı kaydı
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Eksik bilgi' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcı girişi
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Eksik bilgi' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Şifre yanlış' });
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

app.get('/', (req, res) => {
  res.send('Backend çalışıyor!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend ${PORT} portunda çalışıyor.`);
}); 