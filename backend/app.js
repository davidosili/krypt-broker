const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();

// ✅ Detect production mode for Render
const isProduction = process.env.NODE_ENV === 'production';

// ✅ Allowed CORS origins (Frontend + Local)
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://mr73c5kx-5500.uks1.devtunnels.ms', // DevTunnel
  'https://krypt-broker-site.onrender.com',    // Live frontend
];

// ✅ CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ Parse cookies and JSON
app.use(cookieParser());
app.use(express.json());

// ✅ Session config
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,       // Cookie only secure in production
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

console.log('Running in production mode:', isProduction);

// ✅ Import Routes
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const coinProxyRoutes = require('./routes/coinProxyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alertRoutes = require('./routes/alertRoutes');
const newsRoutes = require('./routes/newsRoutes');
const copyRoutes = require('./routes/copyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/coin', coinProxyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/copy', copyRoutes);
app.use('/api/payment', paymentRoutes);

// ✅ Serve frontend statically
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// ✅ Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/frontend/login.html');
});

// ✅ Start background jobs
require('./jobs/priceAlertJob');

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
