import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'aboobakarsithik@gmail.com', // Gmail account
    pass: process.env.GMAIL_APP_PASSWORD || '' // Gmail app password
  }
});

export async function sendEmailWithNodemailer(params: EmailParams): Promise<boolean> {
  try {
    console.log(`Attempting to send email via Gmail SMTP to ${params.to}`);
    
    const result = await transporter.sendMail({
      from: `"Smartyoz Hiring Team" <aboobakarsithik@gmail.com>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log(`Email sent successfully via Gmail SMTP to ${params.to}`, result.messageId);
    return true;
  } catch (error) {
    console.error('Gmail SMTP email error:', error);
    return false;
  }
}

// Test Gmail SMTP configuration
export async function testGmailSMTP(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Gmail SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('Gmail SMTP configuration error:', error);
    return false;
  }
}