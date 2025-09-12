// my-app-backend/utils/email.js SMTP(Simple Mail Transfer Protocol)

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // Convert to boolean
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    minVersion: 'TLSv1.2', // More secure default
    rejectUnauthorized: process.env.NODE_ENV === 'production' // Strict in prod
  },
  logger: true, // Enable logging
  debug: process.env.NODE_ENV !== 'production' // Debug in dev
});

// Enhanced verification
async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    console.error('SMTP Configuration:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      secure: process.env.EMAIL_SECURE
    });
    return false;
  }
}

// Verify on startup and periodically
verifyTransporter();
setInterval(verifyTransporter, 3600000); // 1 hour checks

export const sendVerificationEmail = async (email, code, title, message) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'no-reply'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
    to: email,
    subject: title,
    text: `${message}\n\nYour code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f7f7f7; border-radius: 8px;">
        <div style="text-align: center;">
          <h2 style="color: #302f82;">${title}</h2>
          <p style="font-size: 16px; color: #333;">${message}</p>

          <!-- Code container -->
          <div style="margin: 20px auto; padding: 15px; display: inline-block;">
            <table cellpadding="1" cellspacing="0" border="0" align="center">
              <tr>
                ${[...code].map(
                  (digit) => `
                  <td style="width: 30px; height: 40px; border: 1px solid #302f82; border-radius: 5px; font-size: 24px; font-weight: bold; color: #302f82; text-align: center; vertical-align: middle; padding: 5px; margin-left: 10px">
                    ${digit}
                  </td>`
                ).join('')}
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #555;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #aaa;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `,
    priority: 'high'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', {
      messageId: info.messageId,
      to: email,
      subject: title
    });
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', {
      to: email,
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};