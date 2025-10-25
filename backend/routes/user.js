const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const zod = require('zod');
const User = require('../models/User');
const Account = require('../models/Account');
const { authMiddleware } = require('../middleware/index');
const dotenv = require('dotenv');

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

        // Generate unique QuickPe ID
        const generateQuickPeId = () => {
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            return `QP${randomNum}`;
        };

        let quickpeId;
        let isUnique = false;
        while (!isUnique) {
            quickpeId = generateQuickPeId();
            const existingQuickPeId = await User.findOne({ quickpeId });
            if (!existingQuickPeId) {
                isUnique = true;
            }
        }

        const user = await User.create({
            username: req.body.username,
            password: hashedPassword,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            quickpeId: quickpeId,
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
            username: user.username,
            quickpeId: user.quickpeId
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
    try {
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
                username: existingUser.username,
                quickpeId: existingUser.quickpeId
            }, process.env.JWT_SECRET);

            res.json({
                token: token
            })
            return;
        }

        res.status(411).json({
            message: "Error while logging in"
        })
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
})

// Removed duplicate profile route - using the updated one below

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
                { username: { $regex: filter, $options: 'i' } },
                { quickpeId: { $regex: filter, $options: 'i' } }
            ];
        }

        
        const users = await User.find(query, 'username firstName lastName _id quickpeId')
            .sort({ firstName: 1 });

        
        res.json({
            users: users.map(user => ({
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                quickpeId: user.quickpeId
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

// Search users (alias for /bulk for compatibility)
router.get("/search", authMiddleware, async (req, res) => {
    try {
        const query = req.query.query || req.query.filter || "";

        let filter = { _id: { $ne: req.userId } }; // Exclude current user
        
        if (query) {
            filter.$or = [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } },
                { quickpeId: { $regex: query, $options: 'i' } }
            ];
        }
        
        const users = await User.find(filter, 'username firstName lastName _id quickpeId')
            .sort({ firstName: 1 })
            .limit(20);
        
        res.json({
            success: true,
            users: users.map(user => ({
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                quickpeId: user.quickpeId,
                fullName: `${user.firstName} ${user.lastName}`
            }))
        });
        
    } catch (error) {
        console.error('Error in /search endpoint:', error);
        res.status(500).json({
            success: false,
            message: "Failed to search users",
            error: error.message
        });
    }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        const user = await User.findById(userId, 'firstName lastName username email _id quickpeId settingsEnabled createdAt updatedAt');
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                quickpeId: user.quickpeId,
                settingsEnabled: user.settingsEnabled !== false,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
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

// GET /api/v1/user/list - Get list of users for transfers
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, {
      firstName: 1,
      lastName: 1,
      email: 1,
      quickpeId: 1,
      _id: 0
    }).sort({ firstName: 1 });

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
