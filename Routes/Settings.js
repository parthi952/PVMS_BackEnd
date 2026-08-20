const express = require("express");
const router = express.Router();
const { GetSettings, UpdateSettings } = require("../Controller/SettingsController");
const { protect, authorize } = require("../Middleware/AuthMiddleware");

router.route("/")
  .get(protect, GetSettings)
  .put(protect, authorize("admin"), UpdateSettings);

module.exports = router;
