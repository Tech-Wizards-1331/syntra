import nodemailer from "nodemailer";

// Create transporter lazily to allow dynamic environment variables
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    console.warn("⚠️ SMTP credentials not fully configured in environment variables. Email notifications will be printed to console instead.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export interface SendInviteEmailOptions {
  receiverEmail: string;
  receiverName: string;
  teamName: string;
  leaderName: string;
  hackathonName: string;
}

export async function sendTeamInviteEmail({
  receiverEmail,
  receiverName,
  teamName,
  leaderName,
  hackathonName,
}: SendInviteEmailOptions) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@syntra.com";

  const subject = `Invitation to join Team "${teamName}" for ${hackathonName}`;
  const textContent = `Hello ${receiverName},

You have been invited by ${leaderName} to join their team "${teamName}" for the upcoming hackathon "${hackathonName}".

Please log in to your Syntra participant console to review and accept the invitation.

Best regards,
The Syntra Team`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fafafc;">
      <h2 style="color: #0066cc; font-size: 20px; font-weight: 600; margin-bottom: 16px;">Team Invitation</h2>
      <p style="font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hello <strong>${receiverName}</strong>,</p>
      <p style="font-size: 15px; color: #1d1d1f; line-height: 1.5;">
        You have been invited by <strong>${leaderName}</strong> to join their team <strong>"${teamName}"</strong> for the upcoming hackathon <strong>"${hackathonName}"</strong>.
      </p>
      <div style="margin: 24px 0;">
        <a href="${process.env.AUTH_URL || 'http://localhost:3000'}/participant/dashboard" 
           style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 9999px; font-size: 14px; font-weight: 500; display: inline-block;">
          View Invitation
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7a7a7a;">
        This is an automated notification from Syntra. Please do not reply directly to this email.
      </p>
    </div>
  `;

  if (!mailTransporter) {
    console.log("-----------------------------------------");
    console.log(`✉️ Fallback Email notification sent to console:`);
    console.log(`To: ${receiverEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${textContent}`);
    console.log("-----------------------------------------");
    return { success: true, simulated: true };
  }

  try {
    await mailTransporter.sendMail({
      from: `"Syntra" <${fromAddress}>`,
      to: receiverEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error("❌ Failed to send SMTP email invite:", error);
    // Don't throw so it doesn't crash the application flow if SMTP fails
    return { success: false, error };
  }
}

export interface SendRegistrationWelcomeEmailOptions {
  receiverEmail: string;
  receiverName: string;
  teamName: string;
  hackathonName: string;
  temporaryPassword?: string;
  isNewAccount?: boolean;
  loginUrl?: string;
}

export async function sendBulkRegistrationWelcomeEmail({
  receiverEmail,
  receiverName,
  teamName,
  hackathonName,
  temporaryPassword,
  isNewAccount = true,
  loginUrl,
}: SendRegistrationWelcomeEmailOptions) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@syntra.com";
  const url = loginUrl || `${process.env.AUTH_URL || "http://localhost:3000"}/login`;

  const subject = `Registration Confirmed: Team "${teamName}" for ${hackathonName}`;
  const textContent = `Hello ${receiverName},

Your team "${teamName}" has been successfully registered for the hackathon "${hackathonName}"!

Here are your login credentials:
• Login Portal: ${url}
• Email: ${receiverEmail}
${temporaryPassword ? `• Temporary Password: ${temporaryPassword}` : ""}

IMPORTANT SECURITY NOTICE:
Please log in to your Syntra account and change your password immediately in your profile settings.

Best regards,
The Syntra Team`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0066cc; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Syntra Hackathon Portal</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Team Registration Confirmation</p>
      </div>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 15px; color: #166534; font-weight: 600; margin: 0 0 4px 0;">🎉 Registration Successful!</p>
        <p style="font-size: 14px; color: #15803d; margin: 0;">
          Team <strong>"${teamName}"</strong> has been officially registered for <strong>"${hackathonName}"</strong>.
        </p>
      </div>

      <p style="font-size: 15px; color: #1f2937; line-height: 1.5; margin-bottom: 16px;">
        Hello <strong>${receiverName}</strong>,
      </p>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
        You have been registered as the Team Leader. Below are your login credentials to access the participant dashboard, view your team details, and access your event QR pass:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500; width: 140px;">Login Email:</td>
            <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600; font-family: monospace;">${receiverEmail}</td>
          </tr>
          ${
            temporaryPassword
              ? `<tr>
            <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">Temporary Password:</td>
            <td style="padding: 6px 0; font-size: 14px; color: #0066cc; font-weight: 700; font-family: monospace; letter-spacing: 0.5px;">${temporaryPassword}</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
        <div style="display: flex; align-items: flex-start;">
          <div>
            <p style="font-size: 13px; color: #92400e; font-weight: 600; margin: 0 0 2px 0;">⚠️ Security Notice</p>
            <p style="font-size: 12px; color: #b45309; margin: 0; line-height: 1.4;">
              For security reasons, please log in and change your password immediately from your profile settings.
            </p>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${url}" 
           style="background-color: #0066cc; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 8px rgba(0, 102, 204, 0.25);">
          Log In to Dashboard &rarr;
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
        This is an automated notification from Syntra Hackathon System. If you did not expect this email, please contact the hackathon organizers.
      </p>
    </div>
  `;

  if (!mailTransporter) {
    console.log("-----------------------------------------");
    console.log(`✉️ Simulated Registration Email sent to console:`);
    console.log(`To: ${receiverEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${textContent}`);
    console.log("-----------------------------------------");
    return { success: true, simulated: true };
  }

  try {
    await mailTransporter.sendMail({
      from: `"Syntra Hackathon" <${fromAddress}>`,
      to: receiverEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error("❌ Failed to send registration email:", error);
    return { success: false, error };
  }
}

