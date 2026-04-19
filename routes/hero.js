const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  const result = await getDB().query('SELECT * FROM hero LIMIT 1');
  res.json(result.rows[0] || {});
});

router.put('/', auth, async (req, res) => {
  const { title_mn, title_en, subtitle_mn, subtitle_en, media_type } = req.body;
  await getDB().query(
    'UPDATE hero SET title_mn=$1, title_en=$2, subtitle_mn=$3, subtitle_en=$4, media_type=$5 WHERE id=1',
    [title_mn, title_en, subtitle_mn, subtitle_en, media_type]
  );
  res.json({ success: true });
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  await getDB().query('UPDATE hero SET media_url=$1, media_type=$2 WHERE id=1', [url, type]);
  res.json({ success: true, url, type });
});

module.exports = router;
