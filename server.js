const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// الاتصال بـ MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// توجيه الملفات الثابتة للفرونت إند
app.use(express.static(path.join(__dirname, 'public')));

// ربط المسارات بالـ API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/numbers', require('./routes/numberRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
