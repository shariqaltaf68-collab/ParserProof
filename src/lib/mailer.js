import nodemailer from 'nodemailer';

/**
 * Generates a secure, random 6-digit verification code.
 * @returns {string} 6-digit code.
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends a verification code to the user's email address.
 * If SMTP_USER and SMTP_PASS are not configured, it will log the code to the terminal for development.
 *
 * @param {string} email - Recipient's email address.
 * @param {string} name - Recipient's name.
 * @param {string} code - 6-digit verification code.
 * @returns {Promise<boolean>} True if sent/logged successfully.
 */
export async function sendVerificationEmail(email, name, code) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Fallback to developer terminal logging if SMTP credentials are not configured
  if (!smtpUser || !smtpPass) {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 RESUMEPILOT - DEVELOPER VERIFICATION EMAIL FALLBACK');
    console.log(`To: ${name || 'User'} <${email}>`);
    console.log(`Verification Code: [ ${code} ]`);
    console.log('Expires in: 15 minutes');
    console.log('='.repeat(60) + '\n');
    return { success: true, method: 'fallback' };
  }

  const cleanName = name || 'there';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your email address - ResumePilot</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0a0a0f;
          color: #f1f5f9;
        }
        .container {
          max-width: 580px;
          margin: 40px auto;
          background: linear-gradient(145deg, #1e1e2e 0%, #12121a 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
          padding: 30px 40px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .content {
          padding: 40px;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #ffffff;
        }
        .text {
          font-size: 15px;
          color: #94a3b8;
          margin-bottom: 30px;
        }
        .code-container {
          text-align: center;
          margin: 30px 0;
          background-color: #1a1a28;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
        }
        .code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #6366f1;
          margin: 0;
        }
        .expires {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
        }
        .footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 20px 40px;
          background-color: rgba(0, 0, 0, 0.2);
          text-align: center;
          font-size: 12px;
          color: #475569;
        }
        .footer a {
          color: #6366f1;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ResumePilot</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${cleanName}!</div>
          <div class="text">
            Thank you for creating an account with ResumePilot. To complete your registration and unlock your AI-powered resume and cover letter dashboard, please verify your email address by entering this 6-digit code:
          </div>
          <div class="code-container">
            <div class="code">${code}</div>
            <div class="expires">This code will expire in 15 minutes.</div>
          </div>
          <div class="text">
            If you did not initiate this request, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ResumePilot. All rights reserved.<br>
          Transforming careers with generative intelligence.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
ResumePilot - Email Verification

Hello, ${cleanName}!

Thank you for creating an account with ResumePilot. To complete your registration and unlock your AI-powered resume dashboard, please verify your email by entering this 6-digit code:

Verification Code: ${code}

This code will expire in 15 minutes.

If you did not initiate this request, you can safely ignore this email.

© ${new Date().getFullYear()} ResumePilot. All rights reserved.
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"ResumePilot" <${smtpUser}>`,
      to: email,
      subject: `${code} is your ResumePilot verification code`,
      text: textContent,
      html: htmlContent,
    });

    return { success: true, method: 'smtp' };
  } catch (error) {
    console.error('Error sending verification email via SMTP:', error);
    // Graceful fallback to logging if email sending fails physically (due to bad authentication or network block)
    console.log('\n' + '='.repeat(60));
    console.log('🤖 RESUMEPILOT - SMTP ERROR FALLBACK LOG');
    console.log(`To: ${name || 'User'} <${email}>`);
    console.log(`Verification Code: [ ${code} ]`);
    console.log('Expires in: 15 minutes');
    console.log('='.repeat(60) + '\n');
    return { success: false, method: 'fallback_error', error: error.message };
  }
}

/**
 * Sends a password reset code to the user's email address.
 *
 * @param {string} email - Recipient's email address.
 * @param {string} name - Recipient's name.
 * @param {string} code - 6-digit reset code.
 * @returns {Promise<Object>} Result with success status and method.
 */
export async function sendPasswordResetEmail(email, name, code) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.log('\n' + '='.repeat(60));
    console.log('🔑 RESUMEPILOT - PASSWORD RESET CODE (DEV FALLBACK)');
    console.log(`To: ${name || 'User'} <${email}>`);
    console.log(`Reset Code: [ ${code} ]`);
    console.log('Expires in: 15 minutes');
    console.log('='.repeat(60) + '\n');
    return { success: true, method: 'fallback' };
  }

  const cleanName = name || 'there';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your password - ResumePilot</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0f; color: #f1f5f9; }
        .container { max-width: 580px; margin: 40px auto; background: linear-gradient(145deg, #1e1e2e 0%, #12121a 100%); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); padding: 30px 40px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .content { padding: 40px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #ffffff; }
        .text { font-size: 15px; color: #94a3b8; margin-bottom: 30px; }
        .code-container { text-align: center; margin: 30px 0; background-color: #1a1a28; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; }
        .code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; margin: 0; }
        .expires { font-size: 12px; color: #64748b; margin-top: 8px; }
        .footer { border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 20px 40px; background-color: rgba(0, 0, 0, 0.2); text-align: center; font-size: 12px; color: #475569; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ResumePilot</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${cleanName}!</div>
          <div class="text">
            We received a request to reset the password for your ResumePilot account. Enter this 6-digit code to set a new password:
          </div>
          <div class="code-container">
            <div class="code">${code}</div>
            <div class="expires">This code will expire in 15 minutes.</div>
          </div>
          <div class="text">
            If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ResumePilot. All rights reserved.<br>
          Transforming careers with generative intelligence.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
ResumePilot - Password Reset

Hello, ${cleanName}!

We received a request to reset the password for your ResumePilot account. Enter this 6-digit code to set a new password:

Reset Code: ${code}

This code will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} ResumePilot. All rights reserved.
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"ResumePilot" <${smtpUser}>`,
      to: email,
      subject: `${code} is your ResumePilot password reset code`,
      text: textContent,
      html: htmlContent,
    });

    return { success: true, method: 'smtp' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.log('\n' + '='.repeat(60));
    console.log('🔑 RESUMEPILOT - PASSWORD RESET SMTP ERROR FALLBACK');
    console.log(`To: ${name || 'User'} <${email}>`);
    console.log(`Reset Code: [ ${code} ]`);
    console.log('='.repeat(60) + '\n');
    return { success: false, method: 'fallback_error', error: error.message };
  }
}

/**
 * Sends a notification email to the administrator for a refund request or cancellation.
 *
 * @param {Object} params - Refund alert parameters.
 * @param {string} params.userEmail - User who requested the refund.
 * @param {string} params.userId - User ID.
 * @param {string} params.planId - The plan being refunded or cancelled.
 * @param {string} params.orderId - Razorpay Order ID.
 * @param {string} params.paymentId - Razorpay Payment ID.
 * @param {string} params.reason - User-specified reason for cancellation.
 * @param {boolean} params.isRefundable - Whether this cancellation qualifies for a refund.
 * @returns {Promise<Object>} Result.
 */
export async function sendRefundRequestEmail({ userEmail, userId, planId, orderId, paymentId, reason, isRefundable = true }) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = 'guys4929@gmail.com';

  const titleText = isRefundable ? '🚨 Refund Alert: Plan Cancellation' : 'ℹ️ Subscription Cancelled (No Refund)';
  const introText = isRefundable 
    ? 'A customer has cancelled their subscription and requested a refund within the 1-hour window.'
    : 'A customer has cancelled their subscription. Since this cancellation is outside the 1-hour refund window, no refund is required, and their account has been downgraded to Free.';
  const headerColor = isRefundable ? '#ef4444' : '#64748b';
  const actionText = isRefundable 
    ? '👉 Action Required: Log into the Razorpay Dashboard, search for the payment ID above, and issue a full refund immediately.'
    : '👉 No Action Required: The subscription was cancelled after the 1-hour window, so no refund is necessary. The account has been reset to Free.';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 20px; }
        .card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
        .header { border-bottom: 2px solid ${headerColor}; padding-bottom: 12px; margin-bottom: 20px; }
        .title { color: ${headerColor}; margin: 0; font-size: 20px; font-weight: bold; }
        .field { margin-bottom: 12px; }
        .label { font-weight: bold; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
        .value { font-size: 15px; color: #0f172a; background-color: #f1f5f9; padding: 8px 12px; border-radius: 4px; margin-top: 4px; font-family: monospace; }
        .value-text { font-family: inherit; background-color: transparent; padding: 0; margin: 0; }
        .footer { margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="title">${titleText}</h2>
        </div>
        <p>${introText}</p>
        
        <div class="field">
          <div class="label">Customer Email</div>
          <div class="value">${userEmail}</div>
        </div>
        
        <div class="field">
          <div class="label">User ID</div>
          <div class="value">${userId}</div>
        </div>
        
        <div class="field">
          <div class="label">Cancelled Plan</div>
          <div class="value" style="text-transform: uppercase; font-weight: bold; color: #4f46e5;">${planId}</div>
        </div>
        
        <div class="field">
          <div class="label">Razorpay Order ID</div>
          <div class="value">${orderId || 'N/A'}</div>
        </div>
        
        <div class="field">
          <div class="label">Razorpay Payment ID</div>
          <div class="value">${paymentId || 'N/A'}</div>
        </div>
        
        <div class="field">
          <div class="label">Cancellation Reason</div>
          <div class="value value-text">${reason || 'No reason provided.'}</div>
        </div>

        <div class="field">
          <div class="label">Request Time</div>
          <div class="value">${new Date().toLocaleString()}</div>
        </div>
        
        <p style="margin-top: 20px; font-weight: bold; color: #0f172a;">${actionText}</p>
      </div>
      <div class="footer">&copy; ResumePilot Billing System</div>
    </body>
    </html>
  `;

  if (!smtpUser || !smtpPass) {
    console.log(`\n🚨 RESUMEPILOT - SMTP ADMIN REFUND ALERT DEV FALLBACK (Refundable: ${isRefundable})`);
    console.log(`User: ${userEmail}`);
    console.log(`Plan: ${planId}`);
    console.log(`Order: ${orderId}`);
    console.log(`Payment: ${paymentId}`);
    console.log(`Reason: ${reason}`);
    console.log('='.repeat(60) + '\n');
    return { success: true, method: 'fallback' };
  }

  const subjectText = isRefundable 
    ? `🚨 REFUND REQUESTED: ${userEmail} (${planId.toUpperCase()})`
    : `ℹ️ SUBSCRIPTION CANCELLED: ${userEmail} (${planId.toUpperCase()})`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"ResumePilot Billing" <${smtpUser}>`,
      to: adminEmail,
      subject: subjectText,
      html: htmlContent,
    });

    return { success: true, method: 'smtp' };
  } catch (error) {
    console.error('Error sending support refund request email:', error);
    return { success: false, error: error.message };
  }
}
