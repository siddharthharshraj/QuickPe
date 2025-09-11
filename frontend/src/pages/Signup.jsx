import { useState } from "react"
import { BottomWarning } from "../components/BottomWarning"
import { Button } from "../components/Button"
import { Heading } from "../components/Heading"
import { InputBox } from "../components/InputBox"
import { SubHeading } from "../components/SubHeading"
import { Footer } from "../components/Footer"
import axios from "axios";
import { useNavigate } from "react-router-dom"

export const Signup = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};
        
        if (!firstName.trim()) errors.firstName = "First name is required";
        if (!lastName.trim()) errors.lastName = "Last name is required";
        if (!username.trim()) {
            errors.username = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(username)) {
            errors.username = "Please enter a valid email";
        }
        if (!password) {
            errors.password = "Password is required";
        } else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError("");
        
        try {
            const response = await axios.post("/v1/user/signup", {
                username,
                firstName,
                lastName,
                password
            });
            localStorage.setItem("token", response.data.token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">₹</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">QuickPe</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600">Already have an account?</span>
                            <button
                                onClick={() => navigate("/signin")}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Create Your Account
                        </h2>
                        <p className="mt-2 text-gray-600">
                            Join thousands of users who trust QuickPe for secure digital payments
                        </p>
                    </div>
                </div>
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <InputBox 
                                onChange={e => setFirstName(e.target.value)} 
                                placeholder="John" 
                                label={"First Name"} 
                                error={validationErrors.firstName}
                                required
                            />
                            <InputBox 
                                onChange={e => setLastName(e.target.value)} 
                                placeholder="Doe" 
                                label={"Last Name"} 
                                error={validationErrors.lastName}
                                required
                            />
                            <InputBox 
                                onChange={e => setUsername(e.target.value)} 
                                placeholder="john@example.com" 
                                label={"Email"} 
                                type="email"
                                error={validationErrors.username}
                                required
                            />
                            <InputBox 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Enter password" 
                                label={"Password"} 
                                type="password"
                                error={validationErrors.password}
                                required
                            />
                        </div>

                        <div className="mt-6">
                            <Button 
                                onClick={handleSignup} 
                                label={loading ? "Creating Account..." : "Sign up"} 
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};