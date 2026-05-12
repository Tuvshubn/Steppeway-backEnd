const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function query(sql, args = []) {
  // Convert SQLite ? placeholders to Postgres $1, $2...
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, args);
  return result;
}

// Unified interface: returns { rows }
const db = { execute: ({ sql, args } = {}) => query(sql || arguments[0], args) };

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS hero (
      id SERIAL PRIMARY KEY,
      media_type TEXT DEFAULT 'image',
      media_url TEXT DEFAULT '',
      title_mn TEXT DEFAULT 'Монголын Аялал Жуулчлал',
      title_en TEXT DEFAULT 'Mongolia Travel',
      subtitle_mn TEXT DEFAULT 'Таны мөрөөдлийн аяллыг бид зохион байгуулна',
      subtitle_en TEXT DEFAULT 'We organize your dream journey',
      updated_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS about (
      id SERIAL PRIMARY KEY,
      title_mn TEXT DEFAULT 'Бидний тухай',
      title_en TEXT DEFAULT 'About Us',
      content_mn TEXT DEFAULT '',
      content_en TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      updated_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS tours (
      id SERIAL PRIMARY KEY,
      title_mn TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description_mn TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      price TEXT DEFAULT '',
      duration_mn TEXT DEFAULT '',
      duration_en TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS contact (
      id SERIAL PRIMARY KEY,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address_mn TEXT DEFAULT '',
      address_en TEXT DEFAULT '',
      facebook TEXT DEFAULT '',
      instagram TEXT DEFAULT '',
      updated_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
  `);

  // Seed admin
  const admin = await pool.query("SELECT * FROM users WHERE username = 'admin'");
  if (!admin.rows.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', hash]);
    console.log('Default admin: admin / admin123');
  }

  const hero = await pool.query('SELECT * FROM hero LIMIT 1');
  if (!hero.rows.length) await pool.query("INSERT INTO hero (media_type) VALUES ('image')");

  const about = await pool.query('SELECT * FROM about LIMIT 1');
  if (!about.rows.length) await pool.query(
    'INSERT INTO about (content_mn, content_en) VALUES ($1, $2)',
    ['Бид 2010 оноос хойш Монголын байгаль соёлыг дэлхийд танилцуулж буй компани юм.', 'Since 2010, we have been showcasing Mongolia to the world.']
  );

  const contact = await pool.query('SELECT * FROM contact LIMIT 1');
  if (!contact.rows.length) await pool.query(
    'INSERT INTO contact (phone, email, address_mn, address_en) VALUES ($1, $2, $3, $4)',
    ['+976 9900 0000', 'info@mongoltravel.mn', 'Улаанбаатар хот', 'Ulaanbaatar, Mongolia']
  );

  // Tours are managed via admin panel — no seed data

  console.log('Database ready');
}

function getDB() { return pool; }

module.exports = { getDB, initDB };
