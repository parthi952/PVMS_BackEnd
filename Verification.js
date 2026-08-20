const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Visitor = require("./Models/VisitorData");
const Otp = require("./Models/Otp");
const { sendOtpEmail } = require("./Email/EmailService");

/**
 * 1. Verify Visitor Pass via Scanned QR Code Data
 * Route: POST /api/verification/verify-qr
 */
const VerifyQRPass = asyncHandler(async (req, res) => {
  const { qrData, passReference } = req.body;
  const rawString = (qrData || passReference || "").trim();

  if (!rawString) {
    return res.status(400).json({ success: false, verified: false, message: "No QR Code data provided" });
  }

  // Extract visitorId from reference format "VPMS-PASS-<visitorId>"
  let visitorId = rawString;
  if (rawString.startsWith("VPMS-PASS-")) {
    visitorId = rawString.replace("VPMS-PASS-", "").trim();
  }

  if (!mongoose.Types.ObjectId.isValid(visitorId)) {
    return res.status(400).json({
      success: false,
      verified: false,
      message: "Invalid Visitor Pass Reference format"
    });
  }

  const visitor = await Visitor.findById(visitorId);
  if (!visitor) {
    return res.status(444).json({
      success: false,
      verified: false,
      message: "Visitor Pass not found in system database"
    });
  }

  if (visitor.status === "Cancelled") {
    return res.status(400).json({
      success: false,
      verified: false,
      message: "This Visitor Pass has been CANCELLED and is no longer valid"
    });
  }

  res.status(200).json({
    success: true,
    verified: true,
    message: `QR Pass Verified Successfully for ${visitor.visitorName}`,
    visitor
  });
});

const SendVerificationOtp = asyncHandler(async (req, res) => {
  const { visitorId, email } = req.body;

  let targetEmail = (email || "").trim().toLowerCase();
  let visitor = null;

  if (visitorId && mongoose.Types.ObjectId.isValid(visitorId)) {
    visitor = await Visitor.findById(visitorId);
    if (visitor && visitor.email) {
      targetEmail = visitor.email.trim().toLowerCase();
    }
  }

  if (!targetEmail) {
    return res.status(400).json({ success: false, message: "Visitor email address is required to send verification OTP" });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();


  await Otp.deleteMany({ email: targetEmail });


  await Otp.create({
    email: targetEmail,
    otp: otpCode
  });

  await sendOtpEmail(targetEmail, otpCode, "Visitor Pass Arrival Verification");

  res.status(200).json({
    success: true,
    message: `Verification OTP code sent to ${targetEmail}`,
    email: targetEmail
  });
});


const VerifyOtpPass = asyncHandler(async (req, res) => {
  const { email, visitorId, otpCode } = req.body;

  let targetEmail = (email || "").trim().toLowerCase();
  if (visitorId && mongoose.Types.ObjectId.isValid(visitorId)) {
    const visitor = await Visitor.findById(visitorId);
    if (visitor && visitor.email) {
      targetEmail = visitor.email.trim().toLowerCase();
    }
  }

  if (!targetEmail || !otpCode) {
    return res.status(400).json({ success: false, verified: false, message: "Email and OTP code are required" });
  }

  const validOtp = await Otp.findOne({ email: targetEmail, otp: otpCode.trim() });
  if (!validOtp) {
    return res.status(400).json({
      success: false,
      verified: false,
      message: "Invalid or expired verification OTP code"
    });
  }

  await Otp.deleteMany({ email: targetEmail });

  res.status(200).json({
    success: true,
    verified: true,
    message: "Pass Verified Successfully via Email OTP",
    email: targetEmail
  });
});

module.exports = {
  VerifyQRPass,
  SendVerificationOtp,
  VerifyOtpPass
};
