const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const SECRET = process.env.JWT_SECRET || 'travel_secret_2024';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const result = await getDB().query('SELECT * FROM users WHERE username = $1', [username]);
  if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = result.rows[0];
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(header.replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

router.post('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = await getDB().query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!result.rows.length || !bcrypt.compareSync(oldPassword, result.rows[0].password))
    return res.status(400).json({ error: 'Wrong password' });
  const hash = bcrypt.hashSync(newPassword, 10);
  await getDB().query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
module.exports.auth = auth;
