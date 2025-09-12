import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import zod from 'zod';
import { User, Account } from '../db.js';
import { authMiddleware } from '../middleware/index.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const signupBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
});

router.post("/signup", async (req, res) => {
    try {
        const { success, error } = signupBody.safeParse(req.body);
        if (!success) {
            return res.status(411).json({
                message: "Email already taken / Incorrect inputs",
                error: error.issues
            });
        }

        const existingUser = await User.findOne({
            username: req.body.username
        });

        if (existingUser) {
            return res.status(411).json({
                message: "Email already taken/Incorrect inputs"
            });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const user = await User.create({
            username: req.body.username,
            password: hashedPassword,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
        });
        
        const userId = user._id;

        await Account.create({
            userId,
            balance: 1 + Math.random() * 10000
        });
        

        const token = jwt.sign({
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username
        }, process.env.JWT_SECRET);

        res.json({
            message: "User created successfully",
            token: token
        });
        
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
})

const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

router.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    });

    if (existingUser && await bcrypt.compare(req.body.password, existingUser.password)) {
        const token = jwt.sign({
            userId: existingUser._id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            username: existingUser.username
        }, process.env.JWT_SECRET);

        res.json({
            token: token
        })
        return;
    }

    
    res.status(411).json({
        message: "Error while logging in"
    })
})

const updateBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    const updateData = {};
    if (req.body.firstName) updateData.firstName = req.body.firstName;
    if (req.body.lastName) updateData.lastName = req.body.lastName;
    if (req.body.password) {
        updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    await User.updateOne({ _id: req.userId }, updateData);

    res.json({
        message: "Updated successfully"
    });
})

router.get("/bulk", authMiddleware, async (req, res) => {
    try {
        const filter = req.query.filter || "";

        let query = { _id: { $ne: req.userId } }; // Exclude current user
        
        if (filter) {
            query.$or = [
                { firstName: { $regex: filter, $options: 'i' } },
                { lastName: { $regex: filter, $options: 'i' } },
                { username: { $regex: filter, $options: 'i' } }
            ];
        }

        
        const users = await User.find(query, 'username firstName lastName _id')
            .sort({ firstName: 1 });

        
        res.json({
            users: users.map(user => ({
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName
            }))
        });
        
    } catch (error) {
        console.error('Error in /bulk endpoint:', error);
        res.status(500).json({
            message: "Failed to fetch users",
            error: error.message
        });
    }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        const user = await User.findById(userId, 'firstName lastName username _id');
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            user: user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, username } = req.body;
        const userId = req.userId;

        // Validate input
        if (!firstName || !lastName || !username) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({
            username: username,
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email is already taken by another user"
            });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, username },
            { new: true, select: 'firstName lastName username _id' }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.userId;

        // Validate input
        if (!newPassword) {
            return res.status(400).json({
                message: "New password is required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long"
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await User.findByIdAndUpdate(userId, {
            password: hashedNewPassword
        });

        res.json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

export default router;