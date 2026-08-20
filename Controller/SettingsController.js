const asyncHandler = require("express-async-handler");
const Settings = require("../Models/Settings");

// @desc    Get global settings (meeting duration)
// @route   GET /api/settings
const GetSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ meetingDuration: 30 });
  }
  res.status(200).json(settings);
});

// @desc    Update global settings
// @route   PUT /api/settings
const UpdateSettings = asyncHandler(async (req, res) => {
  const { meetingDuration } = req.body;

  if (meetingDuration !== undefined && (meetingDuration < 5 || meetingDuration > 480)) {
    return res.status(400).json({ message: "Meeting duration must be between 5 and 480 minutes" });
  }

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ meetingDuration: meetingDuration || 30 });
  } else {
    if (meetingDuration !== undefined) {
      settings.meetingDuration = meetingDuration;
    }
    await settings.save();
  }

  res.status(200).json(settings);
});

module.exports = {
  GetSettings,
  UpdateSettings
};
