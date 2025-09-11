import { useState, useEffect } from "react";
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"
import { TransactionHistory } from "../components/TransactionHistory"
import { Footer } from "../components/Footer"
import { NotificationToast } from "../components/NotificationToast"
import { useSocket } from "../hooks/useSocket"
import { jwtDecode } from "jwt-decode"

export const Dashboard = () => {
    const [notifications, setNotifications] = useState([]);
    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserId(decoded.userId);
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }
    }, []);

    const handleNotification = (data) => {
        const notification = {
            id: Date.now(),
            ...data
        };
        setNotifications(prev => [...prev, notification]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    };

    // Initialize socket connection
    useSocket(userId, handleNotification);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return <div className="min-h-screen bg-gray-50 flex flex-col">
        <Appbar />
        <div className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <Balance />
                
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('send')}
                            className={`flex-1 px-6 py-3 text-sm font-medium ${
                                activeTab === 'send'
                                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            💸 Send Money
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 px-6 py-3 text-sm font-medium ${
                                activeTab === 'history'
                                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📊 Transaction History
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {activeTab === 'send' ? <Users /> : <TransactionHistory />}
                    </div>
                </div>
            </div>
        </div>
        <Footer />
        
        {/* Notification Toasts */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
            {notifications.map(notification => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    </div>
}