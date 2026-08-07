const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Visitor = require("../Models/VisitorData");
const User = require("../Models/UserDB");

// Check if two dates fall on the same calendar day
const isSameDay = (d1, d2) => {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};

// Resolve valid User ObjectId for tracking
const getValidUserId = async (performedBy) => {
    if (!performedBy) return null;
    if (mongoose.Types.ObjectId.isValid(performedBy)) {
        return performedBy;
    }
    const user = await User.findOne({
        $or: [{ employeeId: performedBy }, { email: performedBy }]
    });
    if (user) return user._id;

    // Fallback to first available DB user
    const anyUser = await User.findOne();
    return anyUser ? anyUser._id : null;
};

// Fetch visitor list with optional status/search filters
const GetVisitorData = asyncHandler(async (req, res) => {
    const { status, employeeId, search, activeOnly, excludeCancelled } = req.query;
    const filter = {};

    // Exclude cancelled visits from active lists
    if (activeOnly === "true") {
        filter.status = { $in: ["Pending", "Approved", "CheckedIn"] };
    } else if (status) {
        filter.status = status;
    } else if (excludeCancelled === "true") {
        filter.status = { $ne: "Cancelled" };
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Visitor not found" });
    }
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
    }
    res.status(200).json(visitor);
});

// @desc    Add new visitor (Enforcing Business Rules 1 - 5)
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
        return res.status(400).json({ message: "Please provide required fields: visitorName, phone, purpose, employeeId" });
    }

    const now = new Date();
    const targetVisitDate = visitDate ? new Date(visitDate) : new Date();

    // Rule 3: Visit date cannot be earlier than the current date
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inputDateStart = new Date(targetVisitDate.getFullYear(), targetVisitDate.getMonth(), targetVisitDate.getDate());

    if (inputDateStart < todayStart) {
        return res.status(400).json({ message: "Rule 3 Violation: Visit date cannot be earlier than today's date" });
    }

    // Rule 4: For today's registrations, expected arrival time cannot be earlier than current time
    if (isSameDay(targetVisitDate, now) && expectedArrival) {
        const timeParts = expectedArrival.split(":");
        if (timeParts.length >= 2) {
            const arrivalTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(timeParts[0], 10), parseInt(timeParts[1], 10));
            if (arrivalTime < now) {
                return res.status(400).json({ message: "Rule 4 Violation: Expected arrival time cannot be earlier than current time for today's visit" });
            }
        }
    }

    // Rule 1: A visitor cannot have more than one active visit at the same time ("Pending", "Approved", "CheckedIn")
    const activeVisit = await Visitor.findOne({
        phone,
        status: { $in: ["Pending", "Approved", "CheckedIn"] }
    });
    if (activeVisit) {
        return res.status(400).json({ message: `Rule 1 Violation: Visitor already has an active visit (Status: '${activeVisit.status}')` });
    }

    // Rule 2: Duplicate visitor registrations for the same visitor on the same date should not be allowed
    const startOfDay = new Date(inputDateStart);
    const endOfDay = new Date(inputDateStart);
    endOfDay.setHours(23, 59, 59, 999);

    const duplicateVisit = await Visitor.findOne({
        phone,
        visitDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: "Cancelled" }
    });
    if (duplicateVisit) {
        return res.status(400).json({ message: "Rule 2 Violation: Duplicate visitor registration for the same date is not allowed" });
    }

    // Rule 5: An employee cannot have more than three pending visitor requests awaiting approval
    const pendingCount = await Visitor.countDocuments({
        employeeId,
        status: "Pending"
    });
    if (pendingCount >= 3) {
        return res.status(400).json({ message: `Rule 5 Violation: Employee '${employeeId}' already has 3 pending visitor requests awaiting approval` });
    }

    const initialActivity = [];
    const validUserId = await getValidUserId(performedBy);
    if (validUserId && role) {
        initialActivity.push({
            action: "Created",
            performedBy: validUserId,
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
        visitDate: targetVisitDate,
        expectedArrival,
        status: "Pending",
        remarks,
        activity: initialActivity
    });

    res.status(201).json(visitor);
});

// @desc    Update visitor status (Enforcing Business Rules 6, 7, 8, 9)
// @route   PATCH /api/visitors/:id/status
const UpdateVisitorStatus = asyncHandler(async (req, res) => {
    const { status, remarks, performedBy, role } = req.body;

    const allowedStatuses = ["Pending", "Approved", "Rejected", "CheckedIn", "CheckedOut", "Cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Visitor not found" });
    }

    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
    }

    const now = new Date();

    // Rule 6 & Rule 9: Visitors can only be checked in after approval.
    if (status === "CheckedIn") {
        if (visitor.status === "CheckedIn") {
            return res.status(400).json({ message: "Rule 7 Violation: Visitor is already checked in" });
        }
        if (visitor.status !== "Approved") {
            return res.status(400).json({ message: `Rule 6 & 9 Violation: Visitors can only be checked in after approval. Current status is '${visitor.status}'` });
        }
        visitor.checkIn = now;
    }

    // Rule 8: Check-out time must always be later than check-in time.
    if (status === "CheckedOut") {
        if (visitor.status !== "CheckedIn") {
            return res.status(400).json({ message: `Visitor must be checked in before checking out. Current status is '${visitor.status}'` });
        }
        if (visitor.checkIn && now <= new Date(visitor.checkIn)) {
            return res.status(400).json({ message: "Rule 8 Violation: Check-out time must be later than check-in time" });
        }
        visitor.checkOut = now;
    }

    visitor.status = status;
    if (remarks !== undefined) {
        visitor.remarks = remarks;
    }

    const validUserId = await getValidUserId(performedBy);
    if (validUserId && role) {
        visitor.activity.push({
            action: status,
            performedBy: validUserId,
            role,
            time: now,
            remarks: remarks || `Status updated to ${status}`
        });
    }

    const updatedVisitor = await visitor.save();
    res.status(200).json(updatedVisitor);
});


const UpdateVisitor = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Visitor not found" });
    }
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Visitor not found" });
    }
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
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