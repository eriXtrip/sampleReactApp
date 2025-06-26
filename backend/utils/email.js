// root/backend/utils/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Debug: Log environment variables to verify they're loading
console.log('Environment Variables:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_FROM: process.env.EMAIL_FROM
});

const transporter = nodemailer.createTransport({
  service: 'gmail', // Using service name instead of host/port
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendVerificationEmail = async (email, code) => {
  try {
    console.log('Attempting to send email with config:', {
      service: 'gmail',
      user: process.env.EMAIL_USER
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `<p>Your verification code is: <strong>${code}</strong></p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response
    });
    throw new Error('Failed to send verification email');
  }
};