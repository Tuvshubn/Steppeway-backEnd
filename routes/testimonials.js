const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');

// Auto-migrate
const migrate = async () => {
  await getDB().query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      author_name VARCHAR(100) NOT NULL,
      country VARCHAR(100) DEFAULT '',
      stars INTEGER DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
      text TEXT NOT NULL,
      tour_name VARCHAR(200) DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};
migrate().catch(console.error);

// GET all active
router.get('/', async (req, res) => {
  try {
    const { rows } = await getDB().query(
      'SELECT * FROM testimonials WHERE is_active=1 ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all (admin)
router.get('/all', auth, async (req, res) => {
  try {
    const { rows } = await getDB().query('SELECT * FROM testimonials ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST
router.post('/', auth, async (req, res) => {
  try {
    const { author_name, country, stars, text, tour_name, is_active } = req.body;
    const { rows: [r] } = await getDB().query(
      `INSERT INTO testimonials (author_name, country, stars, text, tour_name, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [author_name, country || '', stars || 5, text, tour_name || '', is_active ?? 1]
    );
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT
router.put('/:id', auth, async (req, res) => {
  try {
    const { author_name, country, stars, text, tour_name, is_active } = req.body;
    const { rows: [r] } = await getDB().query(
      `UPDATE testimonials SET author_name=$1, country=$2, stars=$3, text=$4,
       tour_name=$5, is_active=$6 WHERE id=$7 RETURNING *`,
      [author_name, country, stars, text, tour_name, is_active, req.params.id]
    );
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await getDB().query('DELETE FROM testimonials WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
