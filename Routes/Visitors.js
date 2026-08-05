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

router.route("/")
    .get(GetVisitorData)
    .post(AddVisitor);

router.route("/:id")
    .get(GetVisitorById)
    .put(UpdateVisitor)
    .delete(DeleteVisitor);

router.patch("/:id/status", UpdateVisitorStatus);

module.exports = router;