const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  const result = await getDB().query('SELECT * FROM about LIMIT 1');
  res.json(result.rows[0] || {});
});

router.put('/', auth, async (req, res) => {
  const { title_mn, title_en, content_mn, content_en } = req.body;
  await getDB().query(
    'UPDATE about SET title_mn=$1, title_en=$2, content_mn=$3, content_en=$4 WHERE id=1',
    [title_mn, title_en, content_mn, content_en]
  );
  res.json({ success: true });
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  await getDB().query('UPDATE about SET image_url=$1 WHERE id=1', [url]);
  res.json({ success: true, url });
});

module.exports = router;
