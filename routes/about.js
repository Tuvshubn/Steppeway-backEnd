const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');

router.get('/', (req, res) => {
  const rows = getDB().all('SELECT * FROM about LIMIT 1');
  res.json(rows[0] || {});
});

router.put('/', auth, (req, res) => {
  const { title_mn, title_en, content_mn, content_en } = req.body;
  getDB().run(`UPDATE about SET title_mn=?,title_en=?,content_mn=?,content_en=?,updated_at=datetime('now') WHERE id=1`,
    [title_mn, title_en, content_mn, content_en]);
  res.json({ success: true });
});

router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  getDB().run(`UPDATE about SET image_url=?,updated_at=datetime('now') WHERE id=1`, [url]);
  res.json({ success: true, url });
});

module.exports = router;
