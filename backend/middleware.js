require('dotenv').config();
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('No auth token provided');
            return res.status(401).json({ message: 'No auth token provided' });
        }

        const token = authHeader.split(' ')[1];
        
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);
            
            if (!decoded.userId) {
                console.error('Invalid token payload:', decoded);
                return res.status(403).json({ message: 'Invalid token payload' });
            }

            req.userId = decoded.userId;
            console.log('Authenticated user ID:', req.userId);
            next();
        } catch (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({ 
                message: 'Invalid or expired token',
                error: err.message 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Authentication error',
            error: error.message 
        });
    }
};

module.exports = {
    authMiddleware
}