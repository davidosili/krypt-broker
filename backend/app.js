const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser'); // ✅ Needed for sessions to work properly

dotenv.config();

const app = express();

// ✅ CORS config - allow DevTunnel frontend to access the backend
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://mr73c5kx-5500.uks1.devtunnels.ms',
    'https://krypt-broker-site.onrender.com', // ✅ my frontend
  ],
  credentials: true
}));

// ✅ Parse cookies before sessions
app.use(cookieParser());

// ✅ Enable JSON parsing
app.use(express.json());

// ✅ Session config - this must come after cookieParser
const isDevTunnel = process.env.NODE_ENV === 'production' || process.env.DEVTUNNEL === 'true';

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isDevTunnel,
    sameSite: isDevTunnel ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

console.log('isDevTunnel:', isDevTunnel);


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
