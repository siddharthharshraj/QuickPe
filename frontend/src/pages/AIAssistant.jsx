import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  UserIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageSkeleton } from '../components/PageSkeleton';
import apiClient from '../services/api/client';

export const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  const [accountData, setAccountData] = useState({});

  const loadUserData = () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        setUserInfo(JSON.parse(user));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadAccountData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        apiClient.get('/account/balance'),
        apiClient.get('/account/transactions?limit=5')
      ]);
      
      setAccountData({
        balance: balanceRes.data.balance || 0,
        recentTransactions: transactionsRes.data.transactions || []
      });
    } catch (error) {
      console.error('Error loading account data:', error);
    }
  };

  const initializeChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Hello ${userInfo.firstName || 'there'}! I'm your QuickPe AI Assistant. I can help you with account information, transaction history, spending insights, and financial advice. What would you like to know?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  useEffect(() => {
    loadUserData();
    loadAccountData();
    initializeChat();
    
    // Show skeleton for 2 seconds
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
    return (
      <>
        <Header />
        <PageSkeleton type="ai-assistant" />
        <Footer />
      </>
    );
  }

  const quickQuestions = [
    {
      id: 1,
      question: "What's my current balance?",
      category: "balance",
      type: "local"
    },
    {
      id: 2,
      question: "Show my recent transactions",
      category: "transactions",
      type: "local"
    },
    {
      id: 3,
      question: "How much did I spend this month?",
      category: "spending-this-month",
      type: "api"
    },
    {
      id: 4,
      question: "What's my largest transaction?",
      category: "largest-transaction",
      type: "api"
    },
    {
      id: 5,
      question: "Give me this week's summary",
      category: "weekly-summary",
      type: "api"
    },
    {
      id: 6,
      question: "How much can I save monthly?",
      category: "savings-potential",
      type: "api"
    },
    {
      id: 7,
      question: "What's my spending pattern?",
      category: "analytics",
      type: "local"
    },
    {
      id: 8,
      question: "Give me financial advice",
      category: "advice",
      type: "local"
    }
  ];

  const generateAIResponse = (question, category) => {
    const responses = {
      balance: `Your current balance is ₹${accountData.balance?.toLocaleString() || 0}. ${accountData.balance > 10000 ? 'You have a healthy balance!' : 'Consider adding funds to your account.'}`,
      
      transactions: `Here are your recent transactions:\n${accountData.recentTransactions?.slice(0, 3).map((txn, idx) => 
        `${idx + 1}. ${txn.type === 'sent' ? 'Sent' : 'Received'} ₹${txn.amount} ${txn.type === 'sent' ? 'to' : 'from'} ${txn.otherUser?.name || 'Unknown'}`
      ).join('\n') || 'No recent transactions found.'}`,
      
      account: `Your last login was ${userInfo.lastLogin ? new Date(userInfo.lastLogin).toLocaleString() : 'recently'}. Your QuickPe ID is ${userInfo.quickpeId || 'not assigned yet'}.`,
      
      analytics: `Based on your transaction history, you've been ${accountData.recentTransactions?.length > 5 ? 'quite active' : 'moderately active'} with digital payments. ${accountData.balance > 5000 ? 'Your balance management looks good!' : 'Consider maintaining a higher balance for smoother transactions.'}`,
      
      advice: `Here are some financial tips for you:\n• Maintain at least ₹2,000 as emergency balance\n• Review your spending weekly\n• Use QuickPe for cashless transactions\n• Set up automatic bill payments\n• Track your monthly expenses`
    };

    return responses[category] || "I'm here to help! Ask me about your balance, transactions, account details, or financial advice.";
  };

  const handleQuickQuestion = async (question, category, type) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      let aiResponse;
      
      if (type === 'api') {
        // Fetch real-time data from backend
        const response = await apiClient.get(`/ai-assistant/question/${category}`);
        aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.data.message,
          timestamp: new Date()
        };
      } else {
        // Use local data
        aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: generateAIResponse(question, category),
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateSmartResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1000);

    setInputMessage('');
  };

  const generateSmartResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('balance')) {
      return generateAIResponse('', 'balance');
    } else if (lowerMessage.includes('transaction') || lowerMessage.includes('payment')) {
      return generateAIResponse('', 'transactions');
    } else if (lowerMessage.includes('login') || lowerMessage.includes('account')) {
      return generateAIResponse('', 'account');
    } else if (lowerMessage.includes('spending') || lowerMessage.includes('analytics')) {
      return generateAIResponse('', 'analytics');
    } else if (lowerMessage.includes('advice') || lowerMessage.includes('tip')) {
      return generateAIResponse('', 'advice');
    } else {
      return "I can help you with account balance, transaction history, spending insights, and financial advice. What specific information would you like to know?";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      <Header />
      
      <div className="flex-1 pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Assistant</h1>
            <p className="text-slate-600">Your intelligent financial companion</p>
          </motion.div>

          {/* Chat Interface */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Quick Questions */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickQuestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleQuickQuestion(item.question, item.category, item.type)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      item.type === 'api' 
                        ? 'bg-blue-50 hover:bg-blue-100 border-blue-200' 
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      item.type === 'api' ? 'text-blue-800' : 'text-emerald-800'
                    }`}>
                      {item.question}
                    </span>
                    {item.type === 'api' && (
                      <span className="text-xs text-blue-600 block mt-1">🔄 Real-time data</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your account..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics',
      description: 'AI-powered insights into your spending patterns and financial behavior',
      benefits: [
        'Automatic categorization of transactions',
        'Spending pattern analysis',
        'Budget recommendations',
        'Anomaly detection for unusual transactions'
      ]
    },
    {
      icon: LightBulbIcon,
      title: 'Financial Insights',
      description: 'Personalized recommendations to optimize your financial health',
      benefits: [
        'Personalized saving tips',
        'Investment suggestions',
        'Bill payment reminders',
        'Cash flow optimization'
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: 'Fraud Detection',
      description: 'Advanced AI algorithms to protect your account from suspicious activities',
      benefits: [
        'Real-time transaction monitoring',
        'Suspicious pattern detection',
        'Instant security alerts',
        'Automated account protection'
      ]
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Smart Assistant',
      description: 'Natural language interface for managing your finances',
      benefits: [
        'Voice and text commands',
        'Transaction queries',
        'Balance inquiries',
        'Payment scheduling'
      ]
    }
  ];

  const useCases = [
    {
      title: 'Budget Management',
      description: 'Set and track budgets with AI-powered recommendations',
      example: '"Set a monthly budget of ₹15,000 for dining out"',
      icon: CurrencyRupeeIcon
    },
    {
      title: 'Expense Tracking',
      description: 'Automatically categorize and analyze your expenses',
      example: '"Show me my entertainment expenses for this month"',
      icon: ChartBarIcon
    },
    {
      title: 'Payment Reminders',
      description: 'Never miss a payment with intelligent reminders',
      example: '"Remind me to pay electricity bill on 15th every month"',
      icon: ClockIcon
    },
    {
      title: 'Financial Reports',
      description: 'Generate detailed financial reports and insights',
      example: '"Generate my quarterly spending report"',
      icon: DocumentTextIcon
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: SparklesIcon },
    { id: 'features', name: 'Features', icon: LightBulbIcon },
    { id: 'usage', name: 'How to Use', icon: ChatBubbleLeftRightIcon },
    { id: 'benefits', name: 'Benefits', icon: ChartBarIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      <Header />
      
      <div className="flex-1 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">AI Financial Assistant</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Harness the power of artificial intelligence to make smarter financial decisions, 
              automate your money management, and gain deep insights into your spending habits.
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2 mb-8"
          >
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg p-8 text-white">
                  <h2 className="text-2xl font-bold mb-4">What is QuickPe AI Assistant?</h2>
                  <p className="text-lg opacity-90 mb-6">
                    Our AI Assistant is a revolutionary financial companion that uses machine learning 
                    and natural language processing to understand your financial behavior, provide 
                    personalized insights, and help you make better money decisions.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm opacity-90">Always Available</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">99.9%</div>
                      <div className="text-sm opacity-90">Accuracy Rate</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">0.2s</div>
                      <div className="text-sm opacity-90">Response Time</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Key Capabilities</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-slate-700">Natural language transaction queries</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-slate-700">Automated expense categorization</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-slate-700">Predictive spending analysis</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-slate-700">Personalized financial advice</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">How It Works</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold text-sm">1</span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Data Analysis</div>
                          <div className="text-sm text-slate-600">AI analyzes your transaction patterns</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold text-sm">2</span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Pattern Recognition</div>
                          <div className="text-sm text-slate-600">Identifies trends and anomalies</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold text-sm">3</span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Personalized Insights</div>
                          <div className="text-sm text-slate-600">Provides tailored recommendations</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <feature.icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                    </div>
                    <p className="text-slate-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-slate-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">How to Use AI Assistant</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {useCases.map((useCase, index) => (
                      <div key={useCase.title} className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <useCase.icon className="h-5 w-5 text-orange-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">{useCase.title}</h3>
                        </div>
                        <p className="text-slate-600">{useCase.description}</p>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-sm text-slate-500 mb-1">Example:</div>
                          <div className="text-sm font-mono text-slate-700">{useCase.example}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Getting Started</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 mb-1">Access the AI Assistant</div>
                        <div className="text-sm text-slate-600">Click on the AI Assistant tab in your dashboard or use the chat icon</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 mb-1">Start with Simple Queries</div>
                        <div className="text-sm text-slate-600">Try asking "What's my balance?" or "Show me last week's expenses"</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 mb-1">Explore Advanced Features</div>
                        <div className="text-sm text-slate-600">Set up budgets, create reports, and get personalized insights</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CurrencyRupeeIcon className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Save Money</h3>
                    <p className="text-slate-600 text-sm">AI identifies unnecessary expenses and suggests ways to save up to 20% monthly</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ClockIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Save Time</h3>
                    <p className="text-slate-600 text-sm">Automate financial tasks and reduce manual tracking by 80%</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Better Decisions</h3>
                    <p className="text-slate-600 text-sm">Data-driven insights help you make smarter financial choices</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg p-8 text-white">
                  <h2 className="text-2xl font-bold mb-6">Success Stories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-lg font-semibold mb-2">📊 Expense Optimization</div>
                      <p className="text-sm opacity-90">
                        "AI Assistant helped me identify that I was spending 40% more on food delivery than budgeted. 
                        Now I save ₹3,000 monthly!"
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-lg font-semibold mb-2">🎯 Budget Management</div>
                      <p className="text-sm opacity-90">
                        "The AI automatically categorizes my expenses and sends alerts when I'm close to budget limits. 
                        It's like having a personal financial advisor!"
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Chatbot Templates Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">AI Chatbot Templates</h3>
                  <p className="text-slate-600 mb-6">
                    Experience our AI assistant with these pre-built conversation templates designed for common financial scenarios.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Template 1: Budget Planning */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <ChartBarIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Budget Planning Assistant</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        Get personalized budget recommendations based on your spending patterns.
                      </p>
                      <div className="bg-white rounded-lg p-3 text-xs">
                        <div className="flex items-start space-x-2 mb-2">
                          <UserIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-slate-700">"Help me create a monthly budget for ₹50,000 income"</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <ComputerDesktopIcon className="h-4 w-4 text-emerald-600 mt-0.5" />
                          <span className="text-slate-700">"Based on your spending history, I recommend: 50% needs, 30% wants, 20% savings..."</span>
                        </div>
                      </div>
                    </div>

                    {/* Template 2: Expense Analysis */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                          <CurrencyRupeeIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Expense Analyzer</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        Analyze your spending patterns and identify areas for optimization.
                      </p>
                      <div className="bg-white rounded-lg p-3 text-xs">
                        <div className="flex items-start space-x-2 mb-2">
                          <UserIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-slate-700">"Why did I spend so much last month?"</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <ComputerDesktopIcon className="h-4 w-4 text-emerald-600 mt-0.5" />
                          <span className="text-slate-700">"You spent 35% more on dining out. Here's a breakdown and saving tips..."</span>
                        </div>
                      </div>
                    </div>

                    {/* Template 3: Investment Advisor */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <LightBulbIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Investment Advisor</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        Get personalized investment suggestions based on your financial goals.
                      </p>
                      <div className="bg-white rounded-lg p-3 text-xs">
                        <div className="flex items-start space-x-2 mb-2">
                          <UserIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-slate-700">"I want to invest ₹10,000 monthly for retirement"</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <ComputerDesktopIcon className="h-4 w-4 text-emerald-600 mt-0.5" />
                          <span className="text-slate-700">"Consider a mix of equity mutual funds and PPF. Here's a detailed plan..."</span>
                        </div>
                      </div>
                    </div>

                    {/* Template 4: Financial Health Checkup */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                          <ShieldCheckIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Financial Health Checkup</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        Comprehensive analysis of your financial health and improvement suggestions.
                      </p>
                      <div className="bg-white rounded-lg p-3 text-xs">
                        <div className="flex items-start space-x-2 mb-2">
                          <UserIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-slate-700">"How is my financial health overall?"</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <ComputerDesktopIcon className="h-4 w-4 text-emerald-600 mt-0.5" />
                          <span className="text-slate-700">"Your financial health score is 7.5/10. Here are areas to improve..."</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white text-center">
                    <h4 className="font-semibold mb-2">🚀 Coming Soon: Interactive AI Chat</h4>
                    <p className="text-sm opacity-90 mb-4">
                      These templates will soon be available as interactive conversations. 
                      Get ready for personalized financial guidance powered by advanced AI.
                    </p>
                    <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors">
                      Join Waitlist
                    </button>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Ready to Get Started?</h3>
                  <p className="text-slate-600 mb-6">
                    Join thousands of users who are already benefiting from AI-powered financial management. 
                    Start your journey to smarter money management today.
                  </p>
                  <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Try AI Assistant Now
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AIAssistant;
