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

export const sendVerificationEmail = async (email, code, title, message) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: title,
    text: `${message} ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f7f7f7; border-radius: 8px;">
        <div style="text-align: center;">
          <h2 style="color: #007bff;">${title}</h2>
          <p style="font-size: 16px; color: #333;">${message}</p>
          <div style="margin: 20px auto; padding: 15px; background-color: #f7f7f7; border-radius: 8px; border: 2px dashed #007bff; width: fit-content;">
            <h1 style="letter-spacing: 4px; color: #007bff;">${code}</h1>
          </div>
          <p style="font-size: 14px; color: #555;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #aaa;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `
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
