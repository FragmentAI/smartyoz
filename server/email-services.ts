import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Gmail SMTP (Free)
export async function sendEmailWithGmail(params: EmailParams): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials not provided. Set GMAIL_USER and GMAIL_APP_PASSWORD");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
  });

  try {
    await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully via Gmail to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Gmail email error:', error);
    throw error;
  }
}

// Outlook/Hotmail SMTP (Free)
export async function sendEmailWithOutlook(params: EmailParams): Promise<boolean> {
  if (!process.env.OUTLOOK_USER || !process.env.OUTLOOK_PASSWORD) {
    throw new Error("Outlook credentials not provided. Set OUTLOOK_USER and OUTLOOK_PASSWORD");
  }

  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully via Outlook to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Outlook email error:', error);
    throw error;
  }
}

// Ethereal Email (Free testing service)
export async function sendEmailWithEthereal(params: EmailParams): Promise<boolean> {
  // Create test account automatically
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('Email sent via Ethereal:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('Ethereal email error:', error);
    throw error;
  }
}

// Mailtrap SMTP (Free tier - real email delivery)
export async function sendEmailWithMailtrap(params: EmailParams): Promise<boolean> {
  if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASSWORD) {
    throw new Error("Mailtrap credentials not provided. Set MAILTRAP_USER and MAILTRAP_PASSWORD");
  }

  const transporter = nodemailer.createTransport({
    host: 'live.smtp.mailtrap.io',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('Email sent via Mailtrap:', info.messageId);
    return true;
  } catch (error) {
    console.error('Mailtrap email error:', error);
    throw error;
  }
}

// Brevo (formerly Sendinblue) SMTP (Free tier - 300 emails/day)
export async function sendEmailWithBrevo(params: EmailParams): Promise<boolean> {
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    throw new Error("Brevo credentials not provided. Set BREVO_SMTP_USER and BREVO_SMTP_KEY");
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER, // Your SMTP login email from Brevo
      pass: process.env.BREVO_SMTP_KEY,  // Your SMTP key from Brevo
    },
  });

  try {
    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('Email sent via Brevo:', info.messageId);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    throw error;
  }
}

// Mailjet SMTP (Free tier - 200 emails/day)
export async function sendEmailWithMailjet(params: EmailParams): Promise<boolean> {
  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    throw new Error("Mailjet credentials not provided. Set MAILJET_API_KEY and MAILJET_SECRET_KEY");
  }

  const transporter = nodemailer.createTransport({
    host: 'in-v3.mailjet.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILJET_API_KEY,
      pass: process.env.MAILJET_SECRET_KEY,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('Email sent via Mailjet:', info.messageId);
    return true;
  } catch (error) {
    console.error('Mailjet email error:', error);
    throw error;
  }
}

// SendGrid email service
export async function sendEmailWithSendGrid(params: EmailParams, apiKey: string): Promise<boolean> {
  if (!apiKey || !apiKey.startsWith('SG.')) {
    throw new Error('Invalid SendGrid API key');
  }

  const mailService = new MailService();
  mailService.setApiKey(apiKey);

  try {
    const emailData = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };
    
    console.log(`Attempting to send email via SendGrid from ${params.from} to ${params.to}`);
    const result = await mailService.send(emailData);
    console.log(`✅ Email sent via SendGrid successfully`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    if (error.response && error.response.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
      if (error.response.body.errors) {
        console.error('SendGrid specific errors:', error.response.body.errors);
        // Check for common SendGrid issues
        error.response.body.errors.forEach((err: any) => {
          if (err.message.includes('sender')) {
            console.error('⚠️  SENDER VERIFICATION ISSUE: Email sender needs verification in SendGrid dashboard');
          }
          if (err.message.includes('quota') || err.message.includes('limit')) {
            console.error('⚠️  RATE LIMIT ISSUE: SendGrid quota or rate limit exceeded');
          }
          if (err.message.includes('domain')) {
            console.error('⚠️  DOMAIN ISSUE: Domain authentication may be required');
          }
        });
      }
    }
    // Log the API key format for debugging (without exposing the key)
    console.error('API key format check:', apiKey ? `${apiKey.substring(0, 10)}...` : 'No API key');
    throw error;
  }
}

// Universal email sender with multiple free service fallbacks
export async function sendEmail(params: EmailParams): Promise<boolean> {
  console.log(`📧 Attempting to send email to ${params.to} with subject: ${params.subject}`);
  
  // Use SendGrid as primary email service for reliable delivery
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  
  if (sendgridApiKey && sendgridApiKey.startsWith('SG.')) {
    try {
      // Use verified sender email for SendGrid
      const modifiedParams = {
        ...params,
        from: 'aboobakarsithik@gmail.com' // Use verified SendGrid sender
      };
      console.log(`🚀 Using SendGrid to send email from ${modifiedParams.from} to ${params.to}`);
      const result = await sendEmailWithSendGrid(modifiedParams, sendgridApiKey);
      console.log(`✅ Email sent successfully via SendGrid to ${params.to}`);
      return result;
    } catch (error) {
      console.log('❌ SendGrid failed, trying alternatives...');
      console.error('SendGrid error:', error);
    }
  } else {
    console.log('⚠️  SendGrid API key not configured or invalid format');
  }

  // Try Mailtrap if available (best for transactional emails)
  if (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASSWORD) {
    try {
      return await sendEmailWithMailtrap(params);
    } catch (error) {
      console.log('Mailtrap failed, trying alternatives...');
    }
  }

  // Try Brevo (formerly Sendinblue) - 300 emails/day free
  if (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_KEY) {
    try {
      return await sendEmailWithBrevo(params);
    } catch (error) {
      console.log('Brevo failed, trying alternatives...');
    }
  }

  // Try Mailjet - 200 emails/day free
  if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
    try {
      return await sendEmailWithMailjet(params);
    } catch (error) {
      console.log('Mailjet failed, trying alternatives...');
    }
  }

  // Skip the secondary SendGrid integration to avoid conflicts

  // Try Gmail if credentials available
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      return await sendEmailWithGmail(params);
    } catch (error) {
      console.log('Gmail failed, trying alternatives...');
    }
  }

  // Try Outlook if credentials available
  if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD) {
    try {
      return await sendEmailWithOutlook(params);
    } catch (error) {
      console.log('Outlook failed, trying alternatives...');
    }
  }

  // Fallback to Ethereal for testing
  try {
    console.log('⚠️  All production email services unavailable, using Ethereal test service...');
    console.log('⚠️  Note: Test emails will not reach real inboxes - check console for preview URL');
    console.log('⚠️  To send real emails, configure: SendGrid, Gmail SMTP, Brevo, Mailtrap, or Mailjet');
    return await sendEmailWithEthereal(params);
  } catch (error) {
    console.error('All email services failed, including fallback:', error);
    return false;
  }
}