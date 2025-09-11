const mongoose = require('mongoose');
const { Transaction } = require('./models/Transaction');
require('dotenv').config();

async function updateTransactionIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find transactions without transactionId
        const transactionsWithoutId = await Transaction.find({ 
            $or: [
                { transactionId: { $exists: false } },
                { transactionId: null },
                { transactionId: '' }
            ]
        });

        console.log(`Found ${transactionsWithoutId.length} transactions without IDs`);

        // Update each transaction with a unique ID
        for (const transaction of transactionsWithoutId) {
            const newTransactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
            await Transaction.updateOne(
                { _id: transaction._id },
                { $set: { transactionId: newTransactionId } }
            );
            console.log(`Updated transaction ${transaction._id} with ID: ${newTransactionId}`);
        }

        console.log('All transactions updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating transactions:', error);
        process.exit(1);
    }
}

updateTransactionIds();
