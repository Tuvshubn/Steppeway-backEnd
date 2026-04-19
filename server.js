require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://steppeway-admin.vercel.app/',
        'https://steppeway-landing.vercel.app/',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('*', cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hero', require('./routes/hero'));
app.use('/api/about', require('./routes/about'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/contact', require('./routes/contact'));

app.get('/', (req, res) => res.json({ status: 'Travel API running' }));

// Init DB then start server
initDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
