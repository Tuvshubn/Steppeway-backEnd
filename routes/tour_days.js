const express = require('express');
const router = express.Router({ mergeParams: true }); // gets :tourId
const { getDB } = require('../db');
const { auth } = require('./auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Auto-migrate tables
const migrate = async () => {
  const db = getDB();
  await db.query(`
    CREATE TABLE IF NOT EXISTS tour_days (
      id SERIAL PRIMARY KEY,
      tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      title_en TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tour_id, day_number)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS tour_day_images (
      id SERIAL PRIMARY KEY,
      tour_day_id INTEGER NOT NULL REFERENCES tour_days(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};
migrate().catch(console.error);

// GET all days for a tour (with images)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { tourId } = req.params;
    const { rows: days } = await db.query(
      'SELECT * FROM tour_days WHERE tour_id=$1 ORDER BY day_number ASC',
      [tourId]
    );
    // Fetch images for each day
    for (const day of days) {
      const { rows: images } = await db.query(
        'SELECT * FROM tour_day_images WHERE tour_day_id=$1 ORDER BY sort_order ASC, id ASC',
        [day.id]
      );
      day.images = images;
    }
    res.json(days);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — create or update a day
router.post('/', auth, async (req, res) => {
  try {
    const db = getDB();
    const { tourId } = req.params;
    const { day_number, title_en, description_en } = req.body;
    const { rows: [day] } = await db.query(
      `INSERT INTO tour_days (tour_id, day_number, title_en, description_en)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (tour_id, day_number)
       DO UPDATE SET title_en=EXCLUDED.title_en, description_en=EXCLUDED.description_en
       RETURNING *`,
      [tourId, day_number, title_en || '', description_en || '']
    );
    day.images = [];
    res.json(day);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a day
router.delete('/:dayId', auth, async (req, res) => {
  try {
    const db = getDB();
    // Images will cascade delete
    await db.query('DELETE FROM tour_days WHERE id=$1', [req.params.dayId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST image to a day
router.post('/:dayId/images', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const db = getDB();
    const url = `/uploads/${req.file.filename}`;
    const { caption = '', sort_order = 0 } = req.body;
    const { rows: [img] } = await db.query(
      'INSERT INTO tour_day_images (tour_day_id, image_url, caption, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.dayId, url, caption, sort_order]
    );
    res.json(img);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE an image
router.delete('/:dayId/images/:imgId', auth, async (req, res) => {
  try {
    const db = getDB();
    const { rows: [img] } = await db.query(
      'DELETE FROM tour_day_images WHERE id=$1 RETURNING *', [req.params.imgId]
    );
    // Delete file from disk
    if (img?.image_url) {
      const filePath = path.join(__dirname, '..', img.image_url);
      fs.unlink(filePath, () => {});
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
