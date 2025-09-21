const mongoose = require('mongoose');

const tradeAnalyticsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  symbol: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  }, // e.g., 'RELIANCE', 'TCS'
  tradeType: { 
    type: String, 
    enum: ['buy', 'sell'], 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 0
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  strategy: {
    type: String,
    enum: ['momentum', 'mean_reversion', 'breakout', 'scalping', 'swing', 'position'],
    default: 'position'
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  marketData: {
    openPrice: Number,
    highPrice: Number,
    lowPrice: Number,
    closePrice: Number,
    volume: Number,
    marketCap: Number,
    peRatio: Number,
    dividendYield: Number
  },
  performance: {
    pnl: Number,
    pnlPercentage: Number,
    holdingPeriod: Number, // in days
    riskRewardRatio: Number
  },
  metadata: {
    exchange: String,
    sector: String,
    orderType: String,
    commission: Number,
    slippage: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
tradeAnalyticsSchema.index({ userId: 1, timestamp: -1 });
tradeAnalyticsSchema.index({ symbol: 1, tradeType: 1 });
tradeAnalyticsSchema.index({ strategy: 1, timestamp: -1 });
tradeAnalyticsSchema.index({ userId: 1, symbol: 1, timestamp: -1 });

// Virtual for calculating profit/loss
tradeAnalyticsSchema.virtual('isProfit').get(function() {
  return this.performance && this.performance.pnl > 0;
});

// Ensure virtual fields are serialized
tradeAnalyticsSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

// Clear any existing model to avoid schema conflicts
if (mongoose.models.TradeAnalytics) {
    delete mongoose.models.TradeAnalytics;
}

const TradeAnalytics = mongoose.model('TradeAnalytics', tradeAnalyticsSchema);

module.exports = TradeAnalytics;
