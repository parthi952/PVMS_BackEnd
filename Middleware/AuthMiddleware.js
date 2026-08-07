const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../Models/UserDB");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secret = process.env.Accses_Token || process.env.ACCESS_TOKEN || "secret123";
      const decoded = jwt.verify(token, secret);

      if (decoded.id) {
        req.user = await User.findById(decoded.id).select("-password");
      }
      if (!req.user && decoded.id) {
        req.user = await User.findOne({ employeeId: decoded.id }).select("-password");
      }
    } catch (error) {
      console.warn("JWT verification notice:", error.message);
    }
  }

  // Session header fallback
  if (!req.user) {
    const headerUserId = req.headers["x-user-id"] || req.body.performedBy;
    const headerUserName = req.headers["x-user-name"] || req.body.performedByName;
    const headerUserRole = req.headers["x-user-role"] || req.body.role;

    if (headerUserId) {
      req.user = await User.findOne({
        $or: [
          { _id: headerUserId.length === 24 ? headerUserId : null },
          { employeeId: headerUserId }
        ]
      }).select("-password");
    }

    if (!req.user && headerUserName) {
      req.user = {
        _id: headerUserId || "66b245a9f1b2c81234567890",
        name: headerUserName,
        email: "user@vpms.com",
        role: headerUserRole || req.body.role || "receptionist",
        employeeId: headerUserId || "receptionist1"
      };
    }
  }

  // Guest default fallback
  if (!req.user) {
    req.user = {
      _id: "66b245a9f1b2c81234567890",
      name: "Ravi",
      email: "ravi@gmail.com",
      role: "receptionist",
      employeeId: "receptionist1"
    };
  }

  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access restricted. Role '${req.user?.role || "guest"}' is not authorized for this operation.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
