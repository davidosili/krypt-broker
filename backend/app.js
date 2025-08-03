const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser'); // ✅ Needed for sessions

dotenv.config();

const app = express();

// ✅ CORS config - only local + Render frontends
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://krypt-broker-site.onrender.com',
    'https://krypt-broker.onrender.com'
  ],
  credentials: true
}));

// ✅ Parse cookies before sessions
app.use(cookieParser());

// ✅ Enable JSON parsing
app.use(express.json());

// ✅ Session config (secure for production, lax for local)
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,      // ✅ Only true on production
    sameSite: isProduction ? 'none' : 'lax', // ✅ Needed for cross-site cookies
    maxAge: 24 * 60 * 60 * 1000
  }
}));

console.log('isProduction:', isProduction);

// ✅ Routes
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const coinProxyRoutes = require('./routes/coinProxyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alertRoutes = require('./routes/alertRoutes');
const newsRoutes = require('./routes/newsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/coin', coinProxyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/copy', require('./routes/copyRoutes'));
app.use('/api/payment', paymentRoutes);

// ✅ Serve frontend statically
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// ✅ Redirect root path to login page
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
