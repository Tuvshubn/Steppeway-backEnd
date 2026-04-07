const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { auth } = require('./auth');

router.get('/', (req, res) => {
  const rows = getDB().all('SELECT * FROM contact LIMIT 1');
  res.json(rows[0] || {});
});

router.put('/', auth, (req, res) => {
  const { phone, email, address_mn, address_en, facebook, instagram } = req.body;
  getDB().run(`UPDATE contact SET phone=?,email=?,address_mn=?,address_en=?,facebook=?,instagram=?,updated_at=datetime('now') WHERE id=1`,
    [phone, email, address_mn, address_en, facebook, instagram]);
  res.json({ success: true });
});

router.post('/message', (req, res) => {
  const { name, email, phone, message } = req.body;
  getDB().run('INSERT INTO messages (name,email,phone,message) VALUES (?,?,?,?)', [name, email, phone, message]);
  res.json({ success: true });
});

router.get('/messages', auth, (req, res) => {
  res.json(getDB().all('SELECT * FROM messages ORDER BY created_at DESC'));
});

module.exports = router;
