const { sendMail } = require("./Email");
const { getOtpEmailHTML } = require("./Template/OtpEmailTemplate");

/**
 * Reusable helper to send One-Time Password (OTP) email
 */
const sendOtpEmail = async (email, otpCode, purpose = "Verification & Pass Auth") => {
  if (!email) return;
  const html = getOtpEmailHTML(otpCode, purpose);
  return await sendMail(email, `[VPMS] Your Security OTP Code: ${otpCode}`, html);
};

module.exports = {
  sendOtpEmail
};
