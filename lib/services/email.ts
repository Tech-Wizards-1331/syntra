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
