const Joi = require('joi');

// User registration validation
const userRegistrationSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': 'Username must contain only alphanumeric characters',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'any.required': 'Username is required'
        }),
    
    firstName: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.min': 'First name is required',
            'string.max': 'First name cannot exceed 50 characters',
            'any.required': 'First name is required'
        }),
    
    lastName: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.min': 'Last name is required',
            'string.max': 'Last name cannot exceed 50 characters',
            'any.required': 'Last name is required'
        }),
    
    password: Joi.string()
        .min(6)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            'any.required': 'Password is required'
        })
});

// User login validation
const userLoginSchema = Joi.object({
    username: Joi.string()
        .required()
        .messages({
            'any.required': 'Username is required'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required'
        })
});

// Money transfer validation
const transferSchema = Joi.object({
    to: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid recipient ID format',
            'any.required': 'Recipient is required'
        }),
    
    amount: Joi.number()
        .positive()
        .precision(2)
        .min(1)
        .max(1000000)
        .required()
        .messages({
            'number.positive': 'Amount must be positive',
            'number.min': 'Minimum transfer amount is ₹1',
            'number.max': 'Maximum transfer amount is ₹10,00,000',
            'any.required': 'Amount is required'
        })
});

// Add money validation
const addMoneySchema = Joi.object({
    amount: Joi.number()
        .positive()
        .precision(2)
        .min(1)
        .max(100000)
        .required()
        .messages({
            'number.positive': 'Amount must be positive',
            'number.min': 'Minimum amount is ₹1',
            'number.max': 'Maximum amount is ₹1,00,000',
            'any.required': 'Amount is required'
        })
});

// Contact form validation
const contactSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    
    subject: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
            'string.min': 'Subject must be at least 5 characters long',
            'string.max': 'Subject cannot exceed 200 characters',
            'any.required': 'Subject is required'
        }),
    
    message: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Message must be at least 10 characters long',
            'string.max': 'Message cannot exceed 1000 characters',
            'any.required': 'Message is required'
        })
});

// User search validation
const userSearchSchema = Joi.object({
    filter: Joi.string()
        .min(1)
        .max(50)
        .optional()
        .messages({
            'string.min': 'Search filter must be at least 1 character long',
            'string.max': 'Search filter cannot exceed 50 characters'
        })
});

module.exports = {
    userRegistrationSchema,
    userLoginSchema,
    transferSchema,
    addMoneySchema,
    contactSchema,
    userSearchSchema
};
