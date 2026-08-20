const express = require("express");
const router = express.Router();
const {
  VerifyQRPass,
  SendVerificationOtp,
  VerifyOtpPass
} = require("../Verification");
const { protect, authorize } = require("../Middleware/AuthMiddleware");

// Public & Authorized Pass Verification Endpoints
router.post("/verify-qr", VerifyQRPass);
router.post("/send-otp", SendVerificationOtp);
router.post("/verify-otp", VerifyOtpPass);

module.exports = router;
