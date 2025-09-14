const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/index');

// AI Assistant endpoint for predefined questions
router.get('/question/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    
    switch (type) {
      case 'spending-this-month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlySpending = await Transaction.aggregate([
          {
            $match: {
              userId: userId,
              type: 'debit',
              timestamp: { $gte: startOfMonth, $lte: now }
            }
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } }
        ]);

        const totalSpent = monthlySpending.reduce((sum, cat) => sum + cat.total, 0);
        const topCategory = monthlySpending[0];
        
        res.json({
          success: true,
          data: {
            totalSpent,
            topCategory: topCategory ? {
              name: topCategory._id,
              amount: topCategory.total,
              count: topCategory.count
            } : null,
            categories: monthlySpending,
            message: `This month you've spent ₹${totalSpent.toLocaleString()}. Your highest spending category is ${topCategory ? topCategory._id : 'N/A'} with ₹${topCategory ? topCategory.total.toLocaleString() : 0}.`
          }
        });
        break;

      case 'largest-transaction':
        const largestTransaction = await Transaction.findOne({
          userId: userId
        }).sort({ amount: -1 }).populate('receiverId senderId', 'firstName lastName quickpeId');

        if (!largestTransaction) {
          return res.json({
            success: true,
            data: {
              message: "No transactions found in your account."
            }
          });
        }

        const otherUser = largestTransaction.type === 'debit' 
          ? largestTransaction.receiverId 
          : largestTransaction.senderId;

        res.json({
          success: true,
          data: {
            amount: largestTransaction.amount,
            type: largestTransaction.type,
            category: largestTransaction.category,
            timestamp: largestTransaction.timestamp,
            otherUser: otherUser ? {
              name: `${otherUser.firstName} ${otherUser.lastName}`,
              quickpeId: otherUser.quickpeId
            } : null,
            message: `Your largest transaction was ₹${largestTransaction.amount.toLocaleString()} ${largestTransaction.type === 'debit' ? 'sent to' : 'received from'} ${otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown'} on ${largestTransaction.timestamp.toLocaleDateString()}.`
          }
        });
        break;

      case 'weekly-summary':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const [weeklyTransactions, weeklyStats] = await Promise.all([
          Transaction.find({
            userId: userId,
            timestamp: { $gte: weekAgo, $lte: now }
          }).sort({ timestamp: -1 }).limit(10),
          
          Transaction.aggregate([
            {
              $match: {
                userId: userId,
                timestamp: { $gte: weekAgo, $lte: now }
              }
            },
            {
              $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ])
        ]);

        const weeklySpent = weeklyStats.find(s => s._id === 'debit')?.total || 0;
        const weeklyReceived = weeklyStats.find(s => s._id === 'credit')?.total || 0;
        const netFlow = weeklyReceived - weeklySpent;

        res.json({
          success: true,
          data: {
            spent: weeklySpent,
            received: weeklyReceived,
            netFlow,
            transactionCount: weeklyTransactions.length,
            transactions: weeklyTransactions.slice(0, 5),
            message: `This week you spent ₹${weeklySpent.toLocaleString()} and received ₹${weeklyReceived.toLocaleString()}. Your net flow is ${netFlow >= 0 ? '+' : ''}₹${netFlow.toLocaleString()}. You made ${weeklyTransactions.length} transactions.`
          }
        });
        break;

      case 'savings-potential':
        const lastThreeMonths = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        const savingsAnalysis = await Transaction.aggregate([
          {
            $match: {
              userId: userId,
              type: 'debit',
              timestamp: { $gte: lastThreeMonths, $lte: now }
            }
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              avgPerTransaction: { $avg: '$amount' }
            }
          },
          { $sort: { total: -1 } }
        ]);

        const user = await User.findById(userId);
        const currentBalance = user?.balance || 0;
        
        // Calculate potential savings based on spending patterns
        const totalSpentThreeMonths = savingsAnalysis.reduce((sum, cat) => sum + cat.total, 0);
        const monthlyAverage = totalSpentThreeMonths / 3;
        const potentialSavings = Math.floor(monthlyAverage * 0.15); // Assume 15% savings potential

        const topSpendingCategories = savingsAnalysis.slice(0, 3);

        res.json({
          success: true,
          data: {
            currentBalance,
            monthlyAverage,
            potentialSavings,
            topSpendingCategories,
            totalSpentThreeMonths,
            message: `Based on your spending patterns, you could potentially save ₹${potentialSavings.toLocaleString()} per month. Your average monthly spending is ₹${monthlyAverage.toLocaleString()}. Focus on reducing expenses in ${topSpendingCategories[0]?._id || 'your top spending categories'}.`
          }
        });
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Invalid question type'
        });
    }
  } catch (error) {
    console.error('AI Assistant API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI assistant request'
    });
  }
});

module.exports = router;
