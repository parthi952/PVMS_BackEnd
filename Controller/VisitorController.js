const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Visitor = require("../Models/VisitorData");
const User = require("../Models/UserDB");
const Settings = require("../Models/Settings");
const Otp = require("../Models/Otp");
const {
  sendVisitorPendingEmail,
  sendVisitorPassEmail,
  sendEmployeeAlertEmail,
  sendEmployeeNotArrivedReminderEmail,
  sendVisitorNotArrivedEmail,
  sendNextVisitDateEmail,
  sendOtpEmail
} = require("../Email/EmailService");

// Fisher-Yates shuffle algorithm for truly unbiased random employee selection
const getFisherYatesRandomEmployee = (employees) => {
  if (!employees || employees.length === 0) return null;
  const array = [...employees];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array[0];
};

// @desc    Send OTP to visitor email for pass creation verification
// @route   POST /api/visitors/send-otp
const SendVisitorOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Please provide visitor email address to receive OTP" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Delete any existing OTP for this email
  await Otp.deleteMany({ email: cleanEmail });

  // Save new OTP with 10 min expiry
  await Otp.create({
    email: cleanEmail,
    otp: otpCode
  });

  // Send OTP email
  await sendOtpEmail(cleanEmail, otpCode, "Visitor Pass Registration Verification");

  res.status(200).json({
    success: true,
    message: `OTP sent successfully to ${cleanEmail}`,
    email: cleanEmail
  });
});

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
    filter.status = { $in: ["Pending", "Approved", "CheckedIn", "Arrived"] };
  } else if (status) {
    filter.status = status;
  } else if (excludeCancelled === "true") {
    filter.status = { $ne: "Cancelled" };
  }

  if (employeeId) {
    filter.employeeId = employeeId;
  } else if (req.user && req.user.role === "employee" && req.user.employeeId) {
    filter.employeeId = req.user.employeeId;
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

// @desc    Add new visitor (Enforcing Business Rules & Admin Configured Duration)
// @route   POST /api/visitors
const AddVisitor = asyncHandler(async (req, res) => {
  let {
    visitorName,
    phone,
    email,
    purpose,
    employeeId,
    visitDate,
    expectedArrival,
    remarks,
    performedBy,
    role,
    otpCode
  } = req.body;

  if (!visitorName || !phone || !purpose) {
    return res.status(400).json({ message: "Please provide required fields: visitorName, phone, purpose" });
  }

  // OTP Verification for Visitor Email
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    if (!otpCode) {
      return res.status(400).json({ message: "OTP code is required to verify visitor email address" });
    }

    const validOtpRecord = await Otp.findOne({ email: cleanEmail, otp: otpCode.trim() });
    if (!validOtpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new OTP and verify your email." });
    }

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail });
  }

  // Get Admin Configured Global Meeting Duration
  let globalSettings = await Settings.findOne();
  const configuredDuration = globalSettings ? globalSettings.meetingDuration : 30;

  // Handle random employee selection if employeeId is not provided or set to "random"
  let assignedEmpName = "";
  if (!employeeId || employeeId === "random") {
    const employees = await User.find({ role: "employee" });
    const randomEmp = getFisherYatesRandomEmployee(employees);
    if (randomEmp) {
      employeeId = randomEmp.employeeId;
      assignedEmpName = randomEmp.name;
    } else {
      const anyUser = await User.findOne();
      employeeId = anyUser ? anyUser.employeeId : "EMP001";
      assignedEmpName = anyUser ? anyUser.name : "Host Staff";
    }
  } else {
    const matchedUser = await User.findOne({ employeeId });
    if (matchedUser) {
      assignedEmpName = matchedUser.name;
    }
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

  // Rule 1: A visitor cannot have more than one active visit at the same time
  const activeVisit = await Visitor.findOne({
    phone,
    status: { $in: ["Pending", "Approved", "CheckedIn", "Arrived"] }
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
      remarks: remarks || `Visitor pass created (Configured Meeting Duration: ${configuredDuration} mins)`
    });
  }

  const visitor = await Visitor.create({
    visitorName,
    phone,
    email,
    purpose,
    employeeId,
    assignedEmployeeName: assignedEmpName,
    meetingDuration: configuredDuration,
    visitDate: targetVisitDate,
    expectedArrival,
    status: "Pending",
    arrivalStatus: "NotConfirmed",
    remarks,
    activity: initialActivity
  });

  // 1. Send Pending confirmation email to Visitor
  if (email) {
    sendVisitorPendingEmail(visitor);
  }

  // 2. Send Alert email to Assigned Host Employee
  if (employeeId) {
    const assignedEmp = await User.findOne({ employeeId });
    if (assignedEmp && assignedEmp.email) {
      sendEmployeeAlertEmail(assignedEmp.email, assignedEmp.name, visitor, configuredDuration);
    }
  }

  res.status(201).json(visitor);
});

// @desc    Receptionist Arrival Confirmation (Arrived or Not Arrived)
// @route   PATCH /api/visitors/:id/arrival-confirm
const ConfirmArrival = asyncHandler(async (req, res) => {
  const { arrivalStatus, remarks, performedBy, role } = req.body;

  if (!arrivalStatus || !["Arrived", "NotArrived"].includes(arrivalStatus)) {
    return res.status(400).json({ message: "arrivalStatus must be 'Arrived' or 'NotArrived'" });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Visitor not found" });
  }

  const visitor = await Visitor.findById(req.params.id);
  if (!visitor) {
    return res.status(404).json({ message: "Visitor not found" });
  }

  const now = new Date();
  const settings = await Settings.findOne();
  const currentDuration = settings ? settings.meetingDuration : (visitor.meetingDuration || 30);
  visitor.meetingDuration = currentDuration;

  const validUserId = await getValidUserId(performedBy);

  if (arrivalStatus === "Arrived") {
    // 1. Randomly pick an employee from registered employees using Fisher-Yates shuffle
    const employees = await User.find({ role: "employee" });
    let selectedEmployee = getFisherYatesRandomEmployee(employees);

    if (!selectedEmployee) {
      // Fallback if no employee user exists
      selectedEmployee = await User.findOne();
    }

    if (selectedEmployee) {
      visitor.employeeId = selectedEmployee.employeeId;
      visitor.assignedEmployeeName = selectedEmployee.name;
    }

    visitor.arrivalStatus = "Arrived";
    visitor.status = "CheckedIn";
    visitor.checkIn = now;

    const logRemarks = remarks || `Confirmed arrival at Reception. Randomly assigned to host employee ${visitor.assignedEmployeeName} (${visitor.employeeId})`;

    if (validUserId && role) {
      visitor.activity.push({
        action: "Arrived",
        performedBy: validUserId,
        role,
        time: now,
        remarks: logRemarks
      });
    }

    const updatedVisitor = await visitor.save();

    // 2. Send Email Alerts:
    // Email 1: Alert to randomly assigned employee
    if (selectedEmployee && selectedEmployee.email) {
      sendEmployeeAlertEmail(selectedEmployee.email, selectedEmployee.name, updatedVisitor, currentDuration);
    }

    // Email 2: Send Visitor Pass with QR code to Visitor Email
    if (updatedVisitor.email) {
      sendVisitorPassEmail(updatedVisitor, visitor.assignedEmployeeName, currentDuration);
    }

    return res.status(200).json(updatedVisitor);
  } else {
    // Handling NotArrived
    visitor.arrivalStatus = "NotArrived";
    visitor.status = "NotArrived";

    const logRemarks = remarks || "Visitor marked as Not Arrived by Reception";

    if (validUserId && role) {
      visitor.activity.push({
        action: "NotArrived",
        performedBy: validUserId,
        role,
        time: now,
        remarks: logRemarks
      });
    }

    const updatedVisitor = await visitor.save();

    // Send Email Alerts for NotArrived:
    // 1. Send reminder notification to host employee
    if (visitor.employeeId) {
      const emp = await User.findOne({ employeeId: visitor.employeeId });
      if (emp && emp.email) {
        sendEmployeeNotArrivedReminderEmail(emp.email, emp.name, updatedVisitor);
      }
    }

    // 2. Send notification email to visitor
    if (updatedVisitor.email) {
      sendVisitorNotArrivedEmail(updatedVisitor);
    }

    return res.status(200).json(updatedVisitor);
  }
});


const UpdateNextVisitDate = asyncHandler(async (req, res) => {
  const { nextVisitDate, remarks, performedBy, role } = req.body;

  if (!nextVisitDate) {
    return res.status(400).json({ message: "Please provide nextVisitDate" });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Visitor not found" });
  }

  const visitor = await Visitor.findById(req.params.id);
  if (!visitor) {
    return res.status(404).json({ message: "Visitor not found" });
  }

  const targetNextDate = new Date(nextVisitDate);
  visitor.nextVisitDate = targetNextDate;
  visitor.visitDate = targetNextDate;
  visitor.status = "Approved";
  visitor.arrivalStatus = "NotConfirmed";
  visitor.checkIn = undefined;
  visitor.checkOut = undefined;

  const validUserId = await getValidUserId(performedBy);
  const now = new Date();

  if (validUserId && role) {
    visitor.activity.push({
      action: "Approved",
      performedBy: validUserId,
      role,
      time: now,
      remarks: remarks || `Next visiting date scheduled for ${targetNextDate.toLocaleDateString()}`
    });
  }

  const updatedVisitor = await visitor.save();


  if (updatedVisitor.email) {
    sendNextVisitDateEmail(updatedVisitor, targetNextDate);
    sendVisitorPassEmail(
      updatedVisitor,
      updatedVisitor.assignedEmployeeName || updatedVisitor.employeeId,
      updatedVisitor.meetingDuration || 30
    );
  }

  res.status(200).json(updatedVisitor);
});


const UpdateVisitorStatus = asyncHandler(async (req, res) => {
  const { status, remarks, performedBy, role } = req.body;

  const allowedStatuses = ["Pending", "Approved", "Rejected", "CheckedIn", "CheckedOut", "Cancelled", "Arrived", "NotArrived"];
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

  if (status === "CheckedIn" || status === "Arrived") {
    if (!visitor.checkIn) {
      visitor.checkIn = now;
    }
  }

  if (status === "CheckedOut") {
    if (visitor.status !== "CheckedIn" && visitor.status !== "Arrived") {
      return res.status(400).json({ message: `Visitor must be checked in before checking out. Current status is '${visitor.status}'` });
    }
    if (visitor.checkIn && now <= new Date(visitor.checkIn)) {
      return res.status(400).json({ message: "Check-out time must be later than check-in time" });
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

  // If approved, send pass email
  if (status === "Approved" && updatedVisitor.email) {
    sendVisitorPassEmail(updatedVisitor, updatedVisitor.assignedEmployeeName || updatedVisitor.employeeId, updatedVisitor.meetingDuration || 30);
  }

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
  SendVisitorOtp,
  ConfirmArrival,
  UpdateNextVisitDate,
  UpdateVisitorStatus,
  UpdateVisitor,
  DeleteVisitor
};