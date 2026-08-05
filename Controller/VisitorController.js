const asyncHandler = require("express-async-handler");
const Visitor = require("../Models/VisitorData");

// @desc    Get all visitors (with optional filtering by status, employeeId, or search query)
// @route   GET /api/visitors
const GetVisitorData = asyncHandler(async (req, res) => {
    const { status, employeeId, search } = req.query;
    const filter = {};

    if (status) {
        filter.status = status;
    }
    if (employeeId) {
        filter.employeeId = employeeId;
    }
    if (search) {
        filter.$or = [
            { visitorName: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { purpose: { $regex: search, $options: "i" } }
        ];
    }

    const visitors = await Visitor.find(filter).sort({ createdAt: -1 });
    res.status(200).json(visitors);
});

// @desc    Get single visitor by ID
// @route   GET /api/visitors/:id
const GetVisitorById = asyncHandler(async (req, res) => {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        res.status(404);
        throw new Error("Visitor not found");
    }
    res.status(200).json(visitor);
});

// @desc    Add new visitor
// @route   POST /api/visitors
const AddVisitor = asyncHandler(async (req, res) => {
    const {
        visitorName,
        phone,
        email,
        purpose,
        employeeId,
        visitDate,
        expectedArrival,
        remarks,
        performedBy,
        role
    } = req.body;

    if (!visitorName || !phone || !purpose || !employeeId) {
        res.status(400);
        throw new Error("Please provide required fields: visitorName, phone, purpose, employeeId");
    }

    const initialActivity = [];
    if (performedBy && role) {
        initialActivity.push({
            action: "Created",
            performedBy,
            role,
            time: new Date(),
            remarks: remarks || "Visitor pass created"
        });
    }

    const visitor = await Visitor.create({
        visitorName,
        phone,
        email,
        purpose,
        employeeId,
        visitDate: visitDate || new Date(),
        expectedArrival,
        status: "Pending",
        remarks,
        activity: initialActivity
    });

    res.status(201).json(visitor);
});

// @desc    Update visitor status (Approved, Rejected, CheckedIn, CheckedOut, Cancelled)
// @route   PATCH /api/visitors/:id/status
const UpdateVisitorStatus = asyncHandler(async (req, res) => {
    const { status, remarks, performedBy, role } = req.body;

    const allowedStatuses = ["Pending", "Approved", "Rejected", "CheckedIn", "CheckedOut", "Cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status. Must be one of: ${allowedStatuses.join(", ")}`);
    }

    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        res.status(404);
        throw new Error("Visitor not found");
    }

    visitor.status = status;
    if (remarks !== undefined) {
        visitor.remarks = remarks;
    }

    if (status === "CheckedIn") {
        visitor.checkIn = new Date();
    } else if (status === "CheckedOut") {
        visitor.checkOut = new Date();
    }

    if (performedBy && role) {
        visitor.activity.push({
            action: status,
            performedBy,
            role,
            time: new Date(),
            remarks: remarks || `Status updated to ${status}`
        });
    }

    const updatedVisitor = await visitor.save();
    res.status(200).json(updatedVisitor);
});

// @desc    Update visitor details
// @route   PUT /api/visitors/:id
const UpdateVisitor = asyncHandler(async (req, res) => {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        res.status(404);
        throw new Error("Visitor not found");
    }

    const updatedVisitor = await Visitor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json(updatedVisitor);
});

// @desc    Delete visitor
// @route   DELETE /api/visitors/:id
const DeleteVisitor = asyncHandler(async (req, res) => {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        res.status(404);
        throw new Error("Visitor not found");
    }

    await Visitor.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Visitor deleted successfully", id: req.params.id });
});

module.exports = {
    GetVisitorData,
    GetVisitorById,
    AddVisitor,
    UpdateVisitorStatus,
    UpdateVisitor,
    DeleteVisitor
};