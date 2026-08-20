const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    meetingDuration: {
      type: Number,
      required: [true, "Meeting duration is required"],
      default: 30, // in minutes
      min: [5, "Meeting duration must be at least 5 minutes"],
      max: [480, "Meeting duration cannot exceed 480 minutes (8 hours)"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
