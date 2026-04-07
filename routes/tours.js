const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');

router.get('/', (req, res) => res.json(getDB().all('SELECT * FROM tours WHERE is_active=1 ORDER BY created_at DESC')));
router.get('/all', auth, (req, res) => res.json(getDB().all('SELECT * FROM tours ORDER BY created_at DESC')));

router.post('/', auth, (req, res) => {
  const { title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en } = req.body;
  const db = getDB();
  db.run('INSERT INTO tours (title_mn,title_en,description_mn,description_en,price,duration_mn,duration_en) VALUES (?,?,?,?,?,?,?)',
    [title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en]);
  const rows = db.all('SELECT last_insert_rowid() as id');
  res.json({ id: rows[0].id });
});

router.put('/:id', auth, (req, res) => {
  const { title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en, is_active } = req.body;
  getDB().run('UPDATE tours SET title_mn=?,title_en=?,description_mn=?,description_en=?,price=?,duration_mn=?,duration_en=?,is_active=? WHERE id=?',
    [title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en, is_active ?? 1, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  getDB().run('DELETE FROM tours WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

router.post('/:id/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  getDB().run('UPDATE tours SET image_url=? WHERE id=?', [url, req.params.id]);
  res.json({ success: true, url });
});

module.exports = router;
