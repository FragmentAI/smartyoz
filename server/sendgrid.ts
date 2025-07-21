import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    console.log(`Attempting to send email to ${params.to} from ${params.from}`);
    console.log(`Subject: ${params.subject}`);
    
    // Use name with email to improve deliverability
    const fromEmail = params.from.includes('@') ? params.from : 'aboobakarsithik@gmail.com';
    const fromName = 'Smartyoz Hiring Team';
    
    const result = await sgMail.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: params.subject,
      text: params.text,
      html: params.html,
      // Add tracking settings to improve deliverability
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: false
        }
      },
      // Add mail settings for better delivery
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      }
    });

    console.log(`Email sent successfully to ${params.to}`, result[0]?.statusCode);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    console.error('Error details:', error.response?.body || error.message);
    return false;
  }
}