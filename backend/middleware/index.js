const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
            message: "Authorization header missing or invalid"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.isAdmin = decoded.isAdmin;
        next();
    } catch (err) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

const adminMiddleware = async (req, res, next) => {
    // First run auth middleware
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
            message: "Authorization header missing or invalid"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.isAdmin = decoded.isAdmin;

        // Double-check admin status from database
        const user = await User.findById(decoded.userId);
        if (!user || (!user.isAdmin && user.role !== 'admin')) {
            return res.status(403).json({
                message: "Admin access required"
            });
        }

        next();
    } catch (err) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = { authMiddleware, adminMiddleware };
