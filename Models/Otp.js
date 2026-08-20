const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for OTP"],
      trim: true,
      lowercase: true
    },
    otp: {
      type: String,
      required: [true, "OTP code is required"]
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600 // Automatically delete after 10 minutes (600s)
    }
  }
);

module.exports = mongoose.model("Otp", otpSchema);
