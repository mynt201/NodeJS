const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Protect routes - require authentication
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if token exists in header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get user from token
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Token is not valid. User not found.'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Account is deactivated.'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Token is not valid.'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Server error during authentication'
        });
    }
};

// Authorize specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }

        next();
    };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                const user = await User.findById(decoded.userId).select('-password');

                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (error) {
                // Silently fail for optional auth
            }
        }

        next();
    } catch (error) {
        next();
    }
};

// Check if user owns resource or is admin
const ownerOrAdmin = (userIdField = 'user_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Admin can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user owns the resource
        const resourceUserId = req.params[userIdField] || req.body[userIdField];

        if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own resources.'
            });
        }

        next();
    };
};

module.exports = {
    generateToken,
    protect,
    authorize,
    optionalAuth,
    ownerOrAdmin
};