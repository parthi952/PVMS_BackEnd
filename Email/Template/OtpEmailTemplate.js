const { renderEmailLayout } = require("../Email");

/**
 * HTML Template for Security OTP Code email
 */
const getOtpEmailHTML = (otpCode, purpose = "Verification & Pass Auth") => {
  const contentHtml = `
    <p style="font-size: 14px; color: #334155;">Hello,</p>
    <p style="font-size: 14px; color: #334155;">Your One-Time Password (OTP) for <strong>${purpose}</strong> is:</p>
    
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #4f46e5; background-color: #e0e7ff; padding: 12px 24px; border-radius: 12px; border: 2px dashed #6366f1; display: inline-block;">
        ${otpCode}
      </span>
    </div>

    <p style="font-size: 12px; color: #64748b;">This OTP code is valid for 10 minutes. Do not share this code with anyone.</p>
  `;

  return renderEmailLayout({
    headerTitle: "🔒 YOUR VERIFICATION OTP CODE",
    subTitle: "VPMS Security Authentication",
    headerBgColor: "#4f46e5",
    contentHtml
  });
};

module.exports = {
  getOtpEmailHTML
};
