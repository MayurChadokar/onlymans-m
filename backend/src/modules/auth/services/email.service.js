const formData = require('form-data');
const Mailgun = require('mailgun.js');
const logger = require('../../../config/logger');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || 'dummy_key',
});

const DOMAIN = process.env.MAILGUN_DOMAIN;
const FROM_EMAIL = process.env.MAIL_FROM || 'support@onlymans.com';

/**
 * Send an email using Mailgun
 * @param {string} to 
 * @param {string} subject 
 * @param {string} text 
 * @param {string} html 
 */
const sendEmail = async (to, subject, text, html) => {
  if (!process.env.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY === 'your_mailgun_api_key') {
    logger.warn(`Mailgun is not configured. Simulating email to ${to}`);
    logger.info(`Subject: ${subject}`);
    logger.info(`Text: ${text}`);
    return;
  }

  try {
    const msg = await mg.messages.create(DOMAIN, {
      from: FROM_EMAIL,
      to: [to],
      subject,
      text,
      html,
    });
    logger.info(`Email sent successfully to ${to}. ID: ${msg.id}`);
    return msg;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw new Error('Email sending failed');
  }
};

/**
 * Send a password reset email
 * @param {string} to 
 * @param {string} token 
 */
const sendPasswordResetEmail = async (to, token) => {
  const subject = 'Reset Your Password';
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const text = `Dear user,
To reset your password, click on this link: ${resetUrl}
If you did not request any password resets, then ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #00B4D8; text-align: center;">OnlyMans</h2>
      <h3>Reset Your Password</h3>
      <p>Dear user,</p>
      <p>We received a request to reset your password. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #00B4D8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <br />
      <p>Best regards,<br>The OnlyMans Team</p>
    </div>
  `;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
