import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // Start with false for troubleshooting
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3', // Try different SSL method
    rejectUnauthorized: false // For development only
  }
});

// Test connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Configuration:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER
    });
    console.error('SMTP Error Details:', error);
  } else {
    console.log('✅ SMTP Server ready');
  }
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification Code',
    text: `Your code is: ${code}`,
    html: `<b>${code}</b>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send failed:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};