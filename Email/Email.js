const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();


const createTransporter = () => {
  const emailUser = process.env.Email;
  const emailPass = process.env.Email_PasssKey;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const transporter = createTransporter();


const sendMail = async (to, subject, html, attachments = []) => {
  if (!to) {
    console.warn("[EMAIL DISPATCH WARN] Recipient email is missing. Skipping email dispatch.");
    return { success: false, error: "Recipient email is required" };
  }

  try {
    const activeTransporter = createTransporter();
    const emailUser = process.env.Email;

    const mailOptions = {
      from: `"VPMS Pass System" <${emailUser}>`,
      to,
      subject,
      html
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCH SUCCESS] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL DISPATCH ERROR] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};


const renderEmailLayout = ({ headerTitle, subTitle, headerBgColor = "linear-gradient(135deg, #0f766e 0%, #047857 100%)", contentHtml }) => {
  const isGradient = headerBgColor.includes("linear-gradient");
  const headerStyle = isGradient
    ? `background: ${headerBgColor}; color: #ffffff; padding: 28px 24px; text-align: center;`
    : `background-color: ${headerBgColor}; color: #ffffff; padding: 28px 24px; text-align: center;`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f1f5f9;">
      <div style="background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);">
        
        <!-- Theme Header Banner -->
        <div style="${headerStyle}">
          <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; border: 1px solid rgba(255, 255, 255, 0.3);">
            VPMS SECURITY SYSTEM
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">${headerTitle}</h1>
          ${subTitle ? `<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; font-weight: 500;">${subTitle}</p>` : ""}
        </div>

        <!-- Main Content Body -->
        <div style="padding: 28px 24px; background-color: #ffffff;">
          ${contentHtml}
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <div style="font-weight: 800; color: #1e293b; font-size: 13px; margin-bottom: 2px;">Morden Visitor Pass Management System</div>
          Automated Official Notification • Secure Gate Access Pass
        </div>
      </div>
    </div>
  `;
};

module.exports = {
  transporter,
  createTransporter,
  sendMail,
  renderEmailLayout
};
