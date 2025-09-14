import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
    MagnifyingGlassIcon, 
    UserIcon,
    PaperAirplaneIcon,
    UsersIcon 
} from "@heroicons/react/24/outline";
import { Button } from "./Button";
import apiClient from "../services/api/client";
import { useNavigate } from "react-router-dom";

export const Users = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setUsersLoading] = useState(false);
    const [error, setUsersError] = useState("");

    // Fetch users on component mount and when filter changes
    useEffect(() => {
        fetchUsers();
    }, []);

    // Debounce search
    useEffect(() => {
        const timerId = setTimeout(() => {
            if (filter !== "") {
                fetchUsers();
            }
        }, 300);

        return () => clearTimeout(timerId);
    }, [filter]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        setUsersError("");
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            console.log("Fetching users with filter:", filter);
            console.log("Making API call to /user/bulk");
            
            const response = await apiClient.get(`/user/bulk`, {
                params: { filter }
            });
            
            console.log("Users API response:", response);
            console.log("Users data:", response.data);
            console.log("Users array:", response.data.users);
            
            // Handle different response structures
            let usersArray = [];
            if (response.data && Array.isArray(response.data.users)) {
                usersArray = response.data.users;
            } else if (response.data && Array.isArray(response.data)) {
                usersArray = response.data;
            } else if (Array.isArray(response)) {
                usersArray = response;
            }
            
            console.log("Final users array:", usersArray);
            console.log("Users array length:", usersArray.length);
            setUsers(usersArray);
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to load users";
            setUsersError(errorMessage);
            console.error("Users fetch error:", error);
            console.error("Error details:", error.response);
            
            // If unauthorized, redirect to login
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/signin";
            }
        } finally {
            setUsersLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <UsersIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Send Money</h2>
                            <p className="text-emerald-100 text-sm">Choose a recipient</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{users.length}</div>
                        <div className="text-emerald-100 text-sm">
                            user{users.length !== 1 ? 's' : ''} found
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Search */}
            <div className="p-6 border-b border-slate-200">
                <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input 
                        onChange={(e) => setFilter(e.target.value)}
                        type="text" 
                        placeholder="Search users by name..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        aria-label="Search users"
                    />
                </div>
            </div>

            {/* Content Area with Fixed Height and Scroll */}
            <div className="h-96 overflow-y-auto scrollbar-hide">
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <span className="ml-3 text-slate-600">Loading users...</span>
                    </div>
                )}

                {error && (
                    <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                        <p className="font-medium">Error: {error}</p>
                        <button 
                            onClick={fetchUsers}
                            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && users.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <UserIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="font-medium mb-2">
                            {filter ? 'No users found matching your search.' : 'No users available.'}
                        </p>
                        <button 
                            onClick={fetchUsers}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Refresh Users
                        </button>
                    </div>
                )}

                <div className="p-4 space-y-3">
                    {users.length > 0 ? (
                        users.map((user, index) => (
                            <motion.div
                                key={user._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <User user={user} />
                            </motion.div>
                        ))
                    ) : (
                        !loading && !error && (
                            <div className="text-center py-8 text-slate-500">
                                No users to display
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

function User({ user }) {
    const navigate = useNavigate();
    const [isSending, setIsSending] = useState(false);

    console.log("Rendering user:", user);

    if (!user) {
        return <div className="p-4 text-red-500">Invalid user data</div>;
    }

    const handleSendMoney = () => {
        if (isSending) return;
        
        setIsSending(true);
        try {
            navigate(`/send?to=${user._id}&quickpeId=${user.quickpeId}&name=${encodeURIComponent(user.firstName || 'User')}`);
        } catch (error) {
            console.error("Navigation error:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="group bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-4 hover:bg-white/80 hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {(user.firstName && user.firstName[0]) ? user.firstName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-base mb-1 truncate">
                            {user.firstName || 'Unknown'} {user.lastName || ''}
                        </h3>
                        <p className="text-sm text-slate-600 truncate">@{user.username || 'unknown'}</p>
                        <p className="text-xs text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded inline-block mt-1">
                            {user.quickpeId || 'No QuickPe ID'}
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMoney}
                    disabled={isSending}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
                >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span className="text-sm">
                        {isSending ? "Sending..." : "Send"}
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
}; export default Users;
