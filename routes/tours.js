const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  const result = await getDB().query('SELECT * FROM tours WHERE is_active=1 ORDER BY created_at DESC');
  res.json(result.rows);
});

router.get('/all', auth, async (req, res) => {
  const result = await getDB().query('SELECT * FROM tours ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const { title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en } = req.body;
  const result = await getDB().query(
    'INSERT INTO tours (title_mn,title_en,description_mn,description_en,price,duration_mn,duration_en) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en]
  );
  res.json({ id: result.rows[0].id });
});

router.put('/:id', auth, async (req, res) => {
  const { title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en, is_active } = req.body;
  await getDB().query(
    'UPDATE tours SET title_mn=$1,title_en=$2,description_mn=$3,description_en=$4,price=$5,duration_mn=$6,duration_en=$7,is_active=$8 WHERE id=$9',
    [title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en, is_active ?? 1, req.params.id]
  );
  res.json({ success: true });
});

router.delete('/:id', auth, async (req, res) => {
  await getDB().query('DELETE FROM tours WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  await getDB().query('UPDATE tours SET image_url=$1 WHERE id=$2', [url, req.params.id]);
  res.json({ success: true, url });
});

module.exports = router;
