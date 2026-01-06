const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific categories
const authorize = (...categories) => {
  return (req, res, next) => {
    if (!categories.includes(req.user.category)) {
      return res.status(403).json({
        success: false,
        message: `User category ${req.user.category} is not authorized to access this route`
      });
    }
    next();
  };
};

// Verify student status
const verifyStudent = (req, res, next) => {
  if (req.user.category !== 'student' || !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Student verification required for this action'
    });
  }
  next();
};

module.exports = { protect, authorize, verifyStudent };
