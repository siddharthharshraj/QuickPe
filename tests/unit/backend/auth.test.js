import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateToken, adminOnly } from '../../../api/middleware/auth.js';

// Mock jwt
vi.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            user: null
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    describe('authenticateToken', () => {
        it('should authenticate valid token', () => {
            const mockUser = { 
                userId: '123', 
                role: 'user', 
                isAdmin: false 
            };
            
            req.headers.authorization = 'Bearer valid-token';
            jwt.verify.mockReturnValue(mockUser);

            authenticateToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });

        it('should reject request without authorization header', () => {
            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Access token required' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token format', () => {
            req.headers.authorization = 'InvalidFormat';

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Access token required' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token', () => {
            req.headers.authorization = 'Bearer invalid-token';
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Invalid or expired token' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle expired token', () => {
            req.headers.authorization = 'Bearer expired-token';
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => {
                throw error;
            });

            authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Invalid or expired token' 
            });
        });
    });

    describe('adminOnly', () => {
        it('should allow admin users', () => {
            req.user = { 
                userId: '123', 
                role: 'admin', 
                isAdmin: true 
            };

            adminOnly(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject non-admin users', () => {
            req.user = { 
                userId: '123', 
                role: 'user', 
                isAdmin: false 
            };

            adminOnly(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Admin access required' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject requests without user object', () => {
            req.user = null;

            adminOnly(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Admin access required' 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject users with admin role but isAdmin false', () => {
            req.user = { 
                userId: '123', 
                role: 'admin', 
                isAdmin: false 
            };

            adminOnly(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                error: 'Admin access required' 
            });
        });
    });
});
