require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Init DB
initDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hero', require('./routes/hero'));
app.use('/api/about', require('./routes/about'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/contact', require('./routes/contact'));

app.get('/', (req, res) => res.json({ status: 'Travel API running' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
