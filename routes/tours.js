const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');

// Auto-migrate: add new columns if they don't exist
const migrate = async () => {
  const db = getDB();
  const cols = ['tour_type','difficulty','group_size','season','highlights','itinerary','included','not_included'];
  for (const col of cols) {
    try {
      await db.query(`ALTER TABLE tours ADD COLUMN IF NOT EXISTS ${col} TEXT`);
    } catch (e) { /* ignore */ }
  }
};
migrate().catch(() => {});

router.get('/', async (req, res) => {
  try {
    const result = await getDB().query('SELECT * FROM tours WHERE is_active=1 ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/all', auth, async (req, res) => {
  try {
    const result = await getDB().query('SELECT * FROM tours ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en,
            tour_type, difficulty, group_size, season, highlights, itinerary, included, not_included } = req.body;
    const result = await getDB().query(
      `INSERT INTO tours (title_mn,title_en,description_mn,description_en,price,duration_mn,duration_en,
        tour_type,difficulty,group_size,season,highlights,itinerary,included,not_included)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en,
       tour_type, difficulty, group_size, season, highlights, itinerary, included, not_included]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en,
            tour_type, difficulty, group_size, season, highlights, itinerary, included, not_included, is_active } = req.body;
    await getDB().query(
      `UPDATE tours SET title_mn=$1,title_en=$2,description_mn=$3,description_en=$4,price=$5,
        duration_mn=$6,duration_en=$7,tour_type=$8,difficulty=$9,group_size=$10,season=$11,
        highlights=$12,itinerary=$13,included=$14,not_included=$15,is_active=$16 WHERE id=$17`,
      [title_mn, title_en, description_mn, description_en, price, duration_mn, duration_en,
       tour_type, difficulty, group_size, season, highlights, itinerary, included, not_included,
       is_active ?? 1, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await getDB().query('DELETE FROM tours WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  await getDB().query('UPDATE tours SET image_url=$1 WHERE id=$2', [url, req.params.id]);
  res.json({ success: true, url });
});

module.exports = router;
