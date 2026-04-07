const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const SECRET = process.env.JWT_SECRET || 'travel_secret_2024';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const db = getDB();
  const users = db.all('SELECT * FROM users WHERE username = ?', [username]);
  if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = users[0];
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

router.post('/change-password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const db = getDB();
  const users = db.all('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!users.length || !bcrypt.compareSync(oldPassword, users[0].password)) return res.status(400).json({ error: 'Wrong password' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
module.exports.auth = auth;
