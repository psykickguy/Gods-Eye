const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // You can configure this with your email service
  // Examples: Gmail, Outlook, SendGrid, etc.
  
  // For Gmail (you'll need to enable "Less secure app access" or use App Passwords)
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your app password
    }
  });
  
  // For other services, uncomment and configure as needed:
  
  // For Outlook/Hotmail
  // return nodemailer.createTransporter({
  //   service: 'hotmail',
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS
  //   }
  // });
  
  // For custom SMTP server
  // return nodemailer.createTransporter({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   secure: true, // true for 465, false for other ports
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS
  //   }
  // });
};

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gods-eye.com',
      to: email,
      subject: 'Your OTP Code - Gods Eye',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Gods Eye - Verification Code</h2>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
              Your verification code is:
            </p>
            <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 5px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This code will expire in 10 minutes.
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail
};
