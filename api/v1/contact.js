import { connectDB } from '../../backend/db.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        await connectDB();
        
        const { name, email, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Log contact form submission (in production, you might want to save to database)
        console.log('Contact form submission:', { name, email, message });

        return res.json({
            success: true,
            message: "Thank you for your message! We'll get back to you soon."
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
