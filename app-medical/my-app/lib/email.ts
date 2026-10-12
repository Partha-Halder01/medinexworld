import nodemailer from 'nodemailer';

type OtpPurpose = 'register' | 'login';
type OtpDeliveryMode = 'smtp' | 'development_fallback';

export type OtpSendResult = {
  deliveryMode: OtpDeliveryMode;
  message: string;
};

const isDevOtpFallbackEnabled = () =>
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_DEV_OTP_FALLBACK === 'true';

function getMailerConfig() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const from = process.env.SMTP_FROM || user;
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';

  if (!user || !pass || !from) {
    return null;
  }

  return { user, pass, from };
}

export async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose): Promise<OtpSendResult> {
  const config = getMailerConfig();
  if (!config) {
    if (!isDevOtpFallbackEnabled()) {
      throw new Error('OTP email service is unavailable. Configure SMTP credentials.');
    }

    // Optional local-only fallback. OTP is logged server-side and never returned to clients.
    console.info(`[OTP DEV FALLBACK ENABLED] purpose=${purpose} email=${to} otp=${otp}`);
    return {
      deliveryMode: 'development_fallback',
      message: 'OTP generated in development fallback mode.',
    };
  }

  const { user, pass, from } = config;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const title = purpose === 'register' ? 'Verify your Medinex World account' : 'Your Medinex World login OTP';
  const intro =
    purpose === 'register'
      ? 'Use this OTP to verify your new Medinex World account:'
      : 'Use this OTP to sign in to Medinex World:';

  await transporter.sendMail({
    from: `Medinex World <${from}>`,
    to,
    subject: title,
    text: `${intro} ${otp}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 16px;">
        <h2 style="margin: 0 0 12px; color: #0f172a;">Medinex World</h2>
        <p style="font-size: 14px; color: #334155; margin: 0 0 12px;">${intro}</p>
        <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #0f172a; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; display: inline-block;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 16px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });

return {
    deliveryMode: 'smtp',
    message: 'OTP sent to your email.',
  };
}

export async function sendVerificationEmail(to: string, doctorName: string, pass: string) {
  const config = getMailerConfig();
  if (!config) {
    console.info(`[VERIFICATION EMAIL FALLBACK] to=${to} name=${doctorName} pass=${pass}`);
    return;
  }

  const { user, pass: smtpPass, from } = config;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `Medinex World <${from}>`,
    to,
    subject: 'Welcome to Medinex World - Profile Verified!',
    text: `Hello Dr. ${doctorName}, your profile has been verified. Login with your email: ${to} and password: ${pass}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
        <h2 style="color: #059669; margin-top: 0;">Congratulations Dr. ${doctorName}!</h2>
        <p style="color: #334155; font-size: 16px;">Your profile has been verified and is now live on Medinex World.</p>
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: bold; uppercase;">Your Login Credentials</p>
          <p style="margin: 4px 0; color: #0f172a;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 4px 0; color: #0f172a;"><strong>Password:</strong> ${pass}</p>
        </div>
        <p style="color: #334155; font-size: 14px;">You can now manage your appointments and availability from your doctor dashboard.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/doctor-login" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Go to Dashboard</a>
      </div>
    `,
  });
}

export async function sendEnquiryFollowUpEmail(
  to: string,
  patientName: string,
  type: string,
  followUpMessage: string,
  quoteAmount?: number | null,
  status?: string
) {
  const config = getMailerConfig();
  const serviceLabel = type === 'ambulance' ? 'Ambulance Request' : 'Diagnostic Test Enquiry';
  if (!config) {
    console.info(`[ENQUIRY EMAIL FALLBACK] to=${to} patient=${patientName} service=${serviceLabel} message=${followUpMessage}`);
    return;
  }

  const { user, pass: smtpPass, from } = config;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass: smtpPass },
  });

  const subject = `Update on your ${serviceLabel} - Medinex World`;
  await transporter.sendMail({
    from: `Medinex World <${from}>`,
    to,
    subject,
    text: `Hello ${patientName}, here is an update on your ${serviceLabel}:\n\n${followUpMessage}${quoteAmount ? `\nQuotation: ₹${quoteAmount}` : ''}\n\nMedinex World Healthcare Support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
        <h2 style="color: #0f766e; margin-top: 0;">Medinex World Care Update</h2>
        <p style="color: #334155; font-size: 15px;">Hello <strong>${patientName}</strong>,</p>
        <p style="color: #334155; font-size: 14px;">Here is the latest update regarding your <strong>${serviceLabel}</strong>:</p>
        <div style="background: #f0fdfa; border-radius: 12px; padding: 18px; margin: 18px 0; border: 1px solid #ccfbf1;">
          <p style="margin: 0; color: #115e59; font-size: 15px; font-weight: 600; line-height: 1.5;">${followUpMessage}</p>
          ${quoteAmount ? `<p style="margin: 12px 0 0; color: #047857; font-weight: bold; font-size: 14px;">Estimated Quotation: ₹${quoteAmount}</p>` : ''}
          ${status ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Status: ${status.replace('_', ' ')}</p>` : ''}
        </div>
        <p style="color: #64748b; font-size: 12px;">If you have any questions or urgent emergency requirements, please reach our 24/7 care desk.</p>
      </div>
    `,
  });
}
