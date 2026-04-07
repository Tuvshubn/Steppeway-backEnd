const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');

router.get('/', (req, res) => {
  const db = getDB();
  const rows = db.all('SELECT * FROM hero LIMIT 1');
  res.json(rows[0] || {});
});

router.put('/', auth, (req, res) => {
  const db = getDB();
  const { title_mn, title_en, subtitle_mn, subtitle_en, media_type } = req.body;
  db.run(`UPDATE hero SET title_mn=?, title_en=?, subtitle_mn=?, subtitle_en=?, media_type=?, updated_at=datetime('now') WHERE id=1`,
    [title_mn, title_en, subtitle_mn, subtitle_en, media_type]);
  res.json({ success: true });
});

router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const db = getDB();
  const url = `/uploads/${req.file.filename}`;
  const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  db.run(`UPDATE hero SET media_url=?, media_type=?, updated_at=datetime('now') WHERE id=1`, [url, type]);
  res.json({ success: true, url, type });
});

module.exports = router;
