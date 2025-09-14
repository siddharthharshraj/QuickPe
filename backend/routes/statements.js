import express from 'express';
import PDFDocument from 'pdfkit';
import { authMiddleware } from '../middleware/index.js';
import { Transaction } from '../models/Transaction.js';
import { User as UserModel } from '../models/User.js';

const router = express.Router();

// Generate PDF statement
router.get('/pdf', authMiddleware, async (req, res) => {
    try {
        const { from_date, to_date, type = 'all' } = req.query;
        
        // Get user details
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build filter for transactions
        let filter = { userId: req.userId };
        
        if (type === 'credit' || type === 'debit') {
            filter.type = type;
        }
        
        if (from_date || to_date) {
            filter.timestamp = {};
            if (from_date) filter.timestamp.$gte = new Date(from_date);
            if (to_date) filter.timestamp.$lte = new Date(to_date);
        }

        // Get transactions
        const transactions = await Transaction.find(filter)
            .sort({ timestamp: -1 })
            .lean();

        // Create PDF document with enhanced formatting
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            info: {
                Title: 'QuickPe Transaction Statement',
                Author: 'QuickPe Digital Wallet',
                Subject: `Transaction Statement for ${user.firstName} ${user.lastName}`,
                Creator: 'QuickPe Backend System'
            }
        });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="QuickPe-Statement-${user.firstName}-${user.lastName}-${new Date().toISOString().split('T')[0]}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add QuickPe branding header with colors
        doc.rect(0, 0, doc.page.width, 100).fill('#10B981'); // Emerald green header
        
        // QuickPe logo and title
        doc.fillColor('white')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('QuickPe', 50, 30);
        
        doc.fontSize(14)
           .font('Helvetica')
           .text('Digital Wallet Transaction Statement', 50, 65);
        
        // Reset color and add user information section
        doc.fillColor('black')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Account Information', 50, 130);
        
        // User details with better formatting
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Account Holder: ${user.firstName} ${user.lastName}`, 50, 155)
           .text(`Email: ${user.email}`, 50, 175)
           .text(`QuickPe ID: ${user.quickpeId}`, 50, 195)
           .text(`Statement Date: ${new Date().toLocaleDateString('en-IN')}`, 50, 215)
           .text(`Current Balance: ₹${user.balance?.toLocaleString('en-IN') || '0'}`, 50, 235);
        
        // Add summary section with colored boxes
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Transaction Summary', 50, 270);
        
        // Summary boxes with colors
        const summaryY = 295;
        
        // Total Transactions box
        doc.rect(50, summaryY, 120, 60).fill('#F3F4F6').stroke('#E5E7EB');
        doc.fillColor('#374151').fontSize(10).text('Total Transactions', 55, summaryY + 10);
        doc.fillColor('#1F2937').fontSize(18).font('Helvetica-Bold').text(transactions.length.toString(), 55, summaryY + 30);
        
        // Total Credits box
        doc.rect(180, summaryY, 120, 60).fill('#ECFDF5').stroke('#10B981');
        doc.fillColor('#065F46').fontSize(10).font('Helvetica').text('Total Credits', 185, summaryY + 10);
        doc.fillColor('#047857').fontSize(14).font('Helvetica-Bold').text(`₹${transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}`, 185, summaryY + 30);
        
        // Total Debits box
        doc.rect(310, summaryY, 120, 60).fill('#FEF2F2').stroke('#EF4444');
        doc.fillColor('#7F1D1D').fontSize(10).font('Helvetica').text('Total Debits', 315, summaryY + 10);
        doc.fillColor('#DC2626').fontSize(14).font('Helvetica-Bold').text(`₹${transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}`, 315, summaryY + 30);
        
        // Net Amount box
        doc.rect(440, summaryY, 120, 60).fill('#F0F9FF').stroke('#3B82F6');
        doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica').text('Net Amount', 445, summaryY + 10);
        doc.fillColor('#1D4ED8').fontSize(14).font('Helvetica-Bold').text(`₹${(transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0) - transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)).toLocaleString('en-IN')}`, 445, summaryY + 30);
        
        // Transaction details table
        let yPosition = 380;
        doc.fillColor('black')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Transaction Details', 50, yPosition);
        
        yPosition += 30;
        
        // Table header with background
        doc.rect(50, yPosition, 500, 25).fill('#F9FAFB').stroke('#E5E7EB');
        doc.fillColor('#374151')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Date', 55, yPosition + 8)
           .text('Transaction ID', 130, yPosition + 8)
           .text('Description', 230, yPosition + 8)
           .text('Type', 380, yPosition + 8)
           .text('Amount (₹)', 450, yPosition + 8);
        
        yPosition += 35;
        
        // Transaction rows
        let totalDebit = 0;

        // Add transaction rows
        transactions.forEach((transaction, index) => {
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            const date = new Date(transaction.timestamp).toLocaleDateString('en-IN');
            const amount = transaction.type === 'credit' ? `+₹${transaction.amount}` : `-₹${transaction.amount}`;
            
            if (transaction.type === 'credit') {
                totalCredit += transaction.amount;
            } else {
                totalDebit += transaction.amount;
            }

            doc.fontSize(9)
               .text(date, 50, yPosition)
               .text(transaction.transactionId || 'N/A', 120, yPosition)
               .text(transaction.description || 'Transaction', 220, yPosition)
               .text(transaction.type.toUpperCase(), 320, yPosition)
               .text(amount, 370, yPosition)
               .text(`₹${transaction.balance?.toLocaleString() || '0'}`, 430, yPosition);

            yPosition += 20;
        });

        // Add summary
        doc.moveDown(2);
        doc.fontSize(12)
           .text('Summary:', { underline: true })
           .fontSize(10)
           .text(`Total Transactions: ${transactions.length}`)
           .text(`Total Credits: ₹${totalCredit.toLocaleString()}`)
           .text(`Total Debits: ₹${totalDebit.toLocaleString()}`)
           .text(`Net Amount: ₹${(totalCredit - totalDebit).toLocaleString()}`);

        // Add footer
        doc.fontSize(8)
           .text('This is a computer-generated statement from QuickPe Digital Wallet.', 50, 750, { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            message: 'Failed to generate PDF statement',
            error: error.message
        });
    }
});

// Generate CSV statement
router.get('/csv', authMiddleware, async (req, res) => {
    try {
        const { from_date, to_date, type = 'all' } = req.query;
        
        // Get user details
        const user = await UserModel.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build filter for transactions
        let filter = { userId: req.userId };
        
        if (type === 'credit' || type === 'debit') {
            filter.type = type;
        }
        
        if (from_date || to_date) {
            filter.timestamp = {};
            if (from_date) filter.timestamp.$gte = new Date(from_date);
            if (to_date) filter.timestamp.$lte = new Date(to_date);
        }

        // Get transactions
        const transactions = await Transaction.find(filter)
            .sort({ timestamp: -1 })
            .lean();

        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="quickpe-statement-${Date.now()}.csv"`);

        // Create CSV content
        let csvContent = 'Date,Transaction ID,Description,Type,Amount,Balance,Category,Status\n';
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.timestamp).toLocaleDateString('en-IN');
            const amount = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
            
            csvContent += `"${date}","${transaction.transactionId || 'N/A'}","${transaction.description || 'Transaction'}","${transaction.type.toUpperCase()}","${amount}","${transaction.balance || 0}","${transaction.category || 'Transfer'}","${transaction.status || 'completed'}"\n`;
        });

        // Add summary rows
        const totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
        const totalDebit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
        
        csvContent += '\n';
        csvContent += `"Summary","","","","","","",""\n`;
        csvContent += `"Total Transactions","${transactions.length}","","","","","",""\n`;
        csvContent += `"Total Credits","","","","${totalCredit}","","",""\n`;
        csvContent += `"Total Debits","","","","-${totalDebit}","","",""\n`;
        csvContent += `"Net Amount","","","","${totalCredit - totalDebit}","","",""\n`;
        csvContent += `"Current Balance","","","","${user.balance || 0}","","",""\n`;
        csvContent += `"Generated On","${new Date().toLocaleDateString('en-IN')}","","","","","",""\n`;

        res.send(csvContent);

    } catch (error) {
        console.error('CSV generation error:', error);
        res.status(500).json({
            message: 'Failed to generate CSV statement',
            error: error.message
        });
    }
});

export default router;
