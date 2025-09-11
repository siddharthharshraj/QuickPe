const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Create nodemailer transporter  
const createTransporter = async () => {
    // Enhanced Gmail SMTP configuration for Google Workspace
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true, // Enable debug logging
        logger: true
    });
};

// Contact form endpoint
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;


        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Create transporter
        const transporter = await createTransporter();

        // Email content with professional HTML template
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mail from QuickPe Website Visitor</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8fafc;
                }
                .container {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e2e8f0;
                }
                .logo {
                    display: inline-block;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    color: white;
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    line-height: 50px;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .title {
                    color: #1e293b;
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0;
                }
                .subtitle {
                    color: #64748b;
                    font-size: 16px;
                    margin: 5px 0 0 0;
                }
                .content {
                    margin: 20px 0;
                }
                .field {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #3b82f6;
                }
                .field-label {
                    font-weight: bold;
                    color: #374151;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                }
                .field-value {
                    color: #1f2937;
                    font-size: 16px;
                    word-wrap: break-word;
                }
                .message-field {
                    background: #f0f9ff;
                    border-left-color: #0ea5e9;
                    padding: 20px;
                }
                .message-text {
                    white-space: pre-wrap;
                    line-height: 1.6;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                }
                .timestamp {
                    background: #f1f5f9;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    color: #475569;
                    text-align: center;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">₹</div>
                    <h1 class="title">QuickPe Website Contact</h1>
                    <p class="subtitle">New message from website visitor</p>
                </div>
                
                <div class="content">
                    <div class="field">
                        <div class="field-label">Visitor Name</div>
                        <div class="field-value">${name}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Reply Email</div>
                        <div class="field-value">${email}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">Subject</div>
                        <div class="field-value">${subject}</div>
                    </div>
                    
                    <div class="field message-field">
                        <div class="field-label">Message</div>
                        <div class="field-value message-text">${message}</div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This message was sent from the QuickPe website contact form.</p>
                    <p><strong>Reply to:</strong> ${email}</p>
                </div>
                
                <div class="timestamp">
                    Received on ${new Date().toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    })}
                </div>
            </div>
        </body>
        </html>
        `;

        // Email options
        const mailOptions = {
            from: `"QuickPe Contact Form" <${process.env.GMAIL_USER || 'quickpe.demo.contact@gmail.com'}>`,
            to: 'contact@siddharth-dev.tech',
            replyTo: email,
            subject: `Mail from QuickPe Website Visitor ${name}`,
            html: htmlContent,
            text: `
New contact form submission from QuickPe website:

Visitor: ${name}
Reply Email: ${email}
Subject: ${subject}

Message:
${message}

---
Received on ${new Date().toLocaleString()}
Reply to: ${email}
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        
        // Log the preview URL for testing

        res.status(200).json({
            success: true,
            message: 'Message sent successfully! Thank you for contacting us.',
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info) || null
        });

    } catch (error) {
        console.error('❌ Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

module.exports = router;
