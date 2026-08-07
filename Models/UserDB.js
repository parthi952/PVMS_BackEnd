const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  if (!this.password.startsWith("$2a$") && !this.password.startsWith("$2b$") && !this.password.startsWith("$2y$")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$") || this.password.startsWith("$2y$")) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  if (this.password === enteredPassword || this.password.trim() === enteredPassword.trim()) {
    this.password = enteredPassword;
    await this.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model("User", userSchema);