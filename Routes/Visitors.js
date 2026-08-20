const express = require("express");
const router = express.Router();
const {
  GetVisitorData,
  GetVisitorById,
  AddVisitor,
  SendVisitorOtp,
  ConfirmArrival,
  UpdateNextVisitDate,
  UpdateVisitorStatus,
  UpdateVisitor,
  DeleteVisitor
} = require("../Controller/VisitorController");
const { protect, authorize } = require("../Middleware/AuthMiddleware");

router.post("/send-otp", SendVisitorOtp);

router.route("/")
  .get(protect, authorize("admin", "receptionist", "employee"), GetVisitorData)
  .post(protect, authorize("admin", "receptionist", "employee"), AddVisitor);

router.route("/:id")
  .get(protect, authorize("admin", "receptionist", "employee"), GetVisitorById)
  .put(protect, authorize("admin", "receptionist"), UpdateVisitor)
  .delete(protect, authorize("admin"), DeleteVisitor);

router.patch("/:id/arrival-confirm", protect, authorize("admin", "receptionist"), ConfirmArrival);
router.patch("/:id/next-visit", protect, authorize("admin", "receptionist", "employee"), UpdateNextVisitDate);
router.patch("/:id/status", protect, authorize("admin", "receptionist", "employee"), UpdateVisitorStatus);

module.exports = router;