const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');

router.get('/', async (req, res) => {
  const result = await getDB().query('SELECT * FROM contact LIMIT 1');
  res.json(result.rows[0] || {});
});

router.put('/', auth, async (req, res) => {
  const { phone, email, address_mn, address_en, facebook, instagram } = req.body;
  await getDB().query(
    'UPDATE contact SET phone=$1, email=$2, address_mn=$3, address_en=$4, facebook=$5, instagram=$6 WHERE id=1',
    [phone, email, address_mn, address_en, facebook, instagram]
  );
  res.json({ success: true });
});

router.post('/message', async (req, res) => {
  const { name, email, phone, message } = req.body;
  await getDB().query(
    'INSERT INTO messages (name,email,phone,message) VALUES ($1,$2,$3,$4)',
    [name, email, phone, message]
  );
  res.json({ success: true });
});

router.get('/messages', auth, async (req, res) => {
  const result = await getDB().query('SELECT * FROM messages ORDER BY created_at DESC');
  res.json(result.rows);
});

module.exports = router;
