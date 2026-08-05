const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Enter Your Name"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Enter Your Email"],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Enter Your Password"]
    },
    role: {
      type: String,
      enum: ["admin", "receptionist", "employee"],
      default: "employee",
      required: [true, "Specify User Role"]
    },
    employeeId: {
      type: String,
      required: [true, "Enter Your Employee ID"],
      unique: true,
      trim: true
    }
  }
);


module.exports = mongoose.model("User", userSchema);