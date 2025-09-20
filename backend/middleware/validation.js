const { body, param, query, validationResult } = require('express-validator');

// Common validation rules
const commonValidations = {
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    password: body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    name: (field) => body(field)
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage(`${field} must be between 2 and 50 characters`)
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage(`${field} must contain only letters and spaces`),
    
    phone: body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    
    amount: body('amount')
        .isFloat({ min: 0.01, max: 1000000 })
        .withMessage('Amount must be between 0.01 and 1,000,000'),
    
    mongoId: (field) => param(field)
        .isMongoId()
        .withMessage(`Invalid ${field} format`),
    
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ]
};

// Validation middleware
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(error => ({
                    field: error.param,
                    message: error.msg,
                    value: error.value
                }))
            });
        }

        next();
    };
};

// Specific validation sets
const validationSets = {
    signup: [
        commonValidations.name('firstName'),
        commonValidations.name('lastName'),
        commonValidations.email,
        commonValidations.password,
        commonValidations.phone
    ],

    signin: [
        commonValidations.email,
        body('password').notEmpty().withMessage('Password is required')
    ],

    transfer: [
        commonValidations.mongoId('recipientId'),
        commonValidations.amount,
        body('description')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Description must not exceed 200 characters')
    ],

    addMoney: [
        commonValidations.amount
    ],

    updateProfile: [
        commonValidations.name('firstName').optional(),
        commonValidations.name('lastName').optional(),
        commonValidations.phone
    ],

    changePassword: [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        commonValidations.password.withMessage('New password must be between 6 and 128 characters and contain at least one lowercase letter, one uppercase letter, and one number')
    ],

    getTransactions: [
        ...commonValidations.pagination,
        query('type')
            .optional()
            .isIn(['credit', 'debit', 'all'])
            .withMessage('Type must be credit, debit, or all'),
        query('dateFilter')
            .optional()
            .isIn(['today', 'last3days', 'last30days', 'all'])
            .withMessage('Invalid date filter'),
        query('search')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Search term must not exceed 100 characters')
    ]
};

// Sanitization middleware
const sanitize = (req, res, next) => {
    // Sanitize string inputs
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

module.exports = {
    validate,
    validationSets,
    commonValidations,
    sanitize
};
