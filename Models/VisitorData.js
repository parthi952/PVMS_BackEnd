const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["Created", "Approved", "Rejected", "CheckedIn", "CheckedOut", "Cancelled"],
      required: [true, "Action is required"]
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "PerformedBy User ID is required"]
    },
    performedByName: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ["admin", "receptionist", "employee"],
      required: [true, "User role is required"]
    },
    time: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const visitorSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: [true, "Enter Visitor Name"],
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Enter Visitor Phone Number"],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    purpose: {
      type: String,
      required: [true, "Enter Purpose of Visit"],
      trim: true
    },
    employeeId: {
      type: String,
      required: [true, "Enter Host Employee ID"],
      trim: true
    },
    visitDate: {
      type: Date,
      required: [true, "Enter Visit Date"],
      default: Date.now
    },
    expectedArrival: {
      type: String,
      trim: true
    },
    checkIn: {
      type: Date
    },
    checkOut: {
      type: Date
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "CheckedIn", "CheckedOut", "Cancelled"],
      default: "Pending"
    },
    remarks: {
      type: String,
      trim: true
    },
    activity: [activitySchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Visitor", visitorSchema);
