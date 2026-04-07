const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'travel.db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let db;
function getDB() {
  if (!db) db = new Database(DB_PATH);
  return db;
}

function initDB() {
  const db = getDB();
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS hero (id INTEGER PRIMARY KEY AUTOINCREMENT, media_type TEXT DEFAULT 'image', media_url TEXT DEFAULT '', title_mn TEXT DEFAULT 'Монголын Аялал Жуулчлал', title_en TEXT DEFAULT 'Mongolia Travel', subtitle_mn TEXT DEFAULT 'Таны мөрөөдлийн аяллыг бид зохион байгуулна', subtitle_en TEXT DEFAULT 'We organize your dream journey', updated_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS about (id INTEGER PRIMARY KEY AUTOINCREMENT, title_mn TEXT DEFAULT 'Бидний тухай', title_en TEXT DEFAULT 'About Us', content_mn TEXT DEFAULT '', content_en TEXT DEFAULT '', image_url TEXT DEFAULT '', updated_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS tours (id INTEGER PRIMARY KEY AUTOINCREMENT, title_mn TEXT NOT NULL, title_en TEXT NOT NULL, description_mn TEXT DEFAULT '', description_en TEXT DEFAULT '', price TEXT DEFAULT '', duration_mn TEXT DEFAULT '', duration_en TEXT DEFAULT '', image_url TEXT DEFAULT '', is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS contact (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT DEFAULT '', email TEXT DEFAULT '', address_mn TEXT DEFAULT '', address_en TEXT DEFAULT '', facebook TEXT DEFAULT '', instagram TEXT DEFAULT '', updated_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, message TEXT, created_at TEXT DEFAULT (datetime('now')))`);

  const admin = db.all('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!admin.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
    console.log('Default admin: admin / admin123');
  }
  const hero = db.all('SELECT * FROM hero LIMIT 1');
  if (!hero.length) db.run(`INSERT INTO hero (media_type) VALUES ('image')`);
  const about = db.all('SELECT * FROM about LIMIT 1');
  if (!about.length) db.run(`INSERT INTO about (content_mn, content_en) VALUES ('Бид 2010 оноос хойш Монголын байгаль соёлыг дэлхийд танилцуулж буй компани юм.', 'Since 2010, we have been showcasing Mongolia to the world.')`);
  const contact = db.all('SELECT * FROM contact LIMIT 1');
  if (!contact.length) db.run(`INSERT INTO contact (phone, email, address_mn, address_en) VALUES ('+976 9900 0000', 'info@mongoltravel.mn', 'Улаанбаатар хот', 'Ulaanbaatar, Mongolia')`);
  const tours = db.all('SELECT COUNT(*) as c FROM tours');
  if (!tours[0].c) {
    [['Говийн Аялал','Gobi Desert Tour','Говь цөлөөр аялах гайхалтай туршлага.','Amazing journey through the Gobi Desert.','$450','5 хоног','5 Days'],
     ['Хөвсгөл Нуур','Khuvsgul Lake Tour','Монголын тэнгис хэмээн нэрлэгддэг нуур.','The sea of Mongolia.','$380','4 хоног','4 Days'],
     ['Хархорум','Kharkhorin Tour','Эртний нийслэл Хархорумд зочлох.','Visit the ancient capital.','$290','3 хоног','3 Days']
    ].forEach(d => db.run('INSERT INTO tours (title_mn,title_en,description_mn,description_en,price,duration_mn,duration_en) VALUES (?,?,?,?,?,?,?)', d));
  }
  console.log('Database ready');
}
module.exports = { getDB, initDB };
