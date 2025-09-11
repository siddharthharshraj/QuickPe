import { useEffect, useState } from "react";
import { Button } from "./Button";
import apiClient from "../api/client";
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

    return <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Send Money</h2>
            <div className="text-sm text-gray-500">
                {users.length} user{users.length !== 1 ? 's' : ''} found
            </div>
        </div>
        
        <div className="mb-6">
            <div className="relative">
                <input 
                    onChange={(e) => setFilter(e.target.value)}
                    type="text" 
                    placeholder="Search users by name..." 
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Search users"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>

        {loading && (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
        )}

        {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                <p>Error: {error}</p>
                <button 
                    onClick={fetchUsers}
                    className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                    Retry
                </button>
            </div>
        )}

        {!loading && !error && users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
                <p>{filter ? 'No users found matching your search.' : 'No users available.'}</p>
                <button 
                    onClick={fetchUsers}
                    className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                    Refresh Users
                </button>
            </div>
        )}

        <div className="space-y-0">
            {users.length > 0 ? (
                users.map(user => (
                    <User key={user._id} user={user} />
                ))
            ) : (
                !loading && !error && (
                    <div className="text-center py-4 text-gray-500">
                        No users to display
                    </div>
                )
            )}
        </div>

    </div>
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
            navigate(`/send?to=${user._id}&name=${encodeURIComponent(user.firstName || 'User')}`);
        } catch (error) {
            console.error("Navigation error:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex justify-between items-center p-4 mb-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 bg-white shadow-sm">
            <div className="flex items-center min-w-0 flex-1">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                    {(user.firstName && user.firstName[0]) ? user.firstName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {user.firstName || 'Unknown'} {user.lastName || ''}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">@{user.username || 'unknown'}</p>
                </div>
            </div>
            <button
                onClick={handleSendMoney}
                disabled={isSending}
                className="ml-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 flex-shrink-0"
            >
                {isSending ? "Redirecting..." : "Send Money"}
            </button>
        </div>
    );
}