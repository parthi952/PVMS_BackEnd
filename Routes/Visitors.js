const express = require("express");
const router = express.Router();
const {
    GetVisitorData,
    GetVisitorById,
    AddVisitor,
    UpdateVisitorStatus,
    UpdateVisitor,
    DeleteVisitor
} = require("../Controller/VisitorController");
const { protect, authorize } = require("../Middleware/AuthMiddleware");

router.route("/")
    .get(protect, GetVisitorData)
    .post(protect, authorize("admin", "receptionist", "employee"), AddVisitor);

router.route("/:id")
    .get(protect, GetVisitorById)
    .put(protect, authorize("admin", "receptionist"), UpdateVisitor)
    .delete(protect, authorize("admin"), DeleteVisitor);

router.patch("/:id/status", protect, authorize("admin", "receptionist", "employee"), UpdateVisitorStatus);

module.exports = router;