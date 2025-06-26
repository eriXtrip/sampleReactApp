// testMailtrap.js
import { sendVerificationEmail } from './backend/utils/email.js';

async function testEmailSending() {
  const testEmail = 'jedt2022-7943-17028@bicol-u.edu.ph'; // Your test email
  const testCode = '123456'; // Test verification code

  try {
    console.log('Attempting to send test email...');
    await sendVerificationEmail(testEmail, testCode);
    console.log('Test email sent successfully!');
    
    // Additional information based on your email provider
    if (process.env.EMAIL_HOST === 'smtp.gmail.com') {
      console.log('Note: If using Gmail, check:');
      console.log('1. Your inbox (and spam folder)');
      console.log('2. That "Less secure app access" is enabled if not using OAuth2');
    } else if (process.env.EMAIL_HOST?.includes('mailtrap')) {
      console.log('Check your Mailtrap inbox at: https://mailtrap.io/inboxes');
    }
  } catch (error) {
    console.error('Failed to send test email:');
    console.error(error.message);
    
    // Common error troubleshooting
    if (error.message.includes('Invalid login')) {
      console.log('\nTroubleshooting:');
      console.log('1. Verify your EMAIL_USER and EMAIL_PASSWORD are correct');
      console.log('2. For Gmail, ensure you enabled "Less secure app access" or use App Password');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\nTroubleshooting:');
      console.log('1. Verify EMAIL_HOST and EMAIL_PORT are correct');
      console.log('2. Check your internet connection');
    }
  }
}

testEmailSending();