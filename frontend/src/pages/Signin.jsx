import { useState } from "react"
import { Heading } from "../components/Heading"
import { SubHeading } from "../components/SubHeading"
import { InputBox } from "../components/InputBox"
import { Button } from "../components/Button"
import { BottomWarning } from "../components/BottomWarning"
import { Footer } from "../components/Footer"
import { Header } from "../components/Header"
import axios from "axios";
import { useNavigate } from "react-router-dom"

export const Signin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();

    const handleSignin = async () => {
        setLoading(true);
        setError("");
        setValidationErrors({});

        // Validate inputs
        const errors = {};
        if (!username.trim()) {
            errors.username = "Email is required";
        }
        if (!password) {
            errors.password = "Password is required";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/v1/user/signin", {
                username,
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

    const handleTestLogin = async () => {
        setUsername("siddharth.harsh@example.com");
        setPassword("password123");
        setError("");
        setValidationErrors({});
        
        // Auto-login after setting credentials
        setTimeout(async () => {
            setLoading(true);
            try {
                const response = await axios.post("/api/v1/user/signin", {
                    username: "siddharth.harsh@example.com",
                    password: "password123"
                });
                localStorage.setItem("token", response.data.token);
                navigate("/dashboard");
            } catch (err) {
                setError(err.response?.data?.message || "Test login failed. Please try again.");
            } finally {
                setLoading(false);
            }
        }, 500);
    };

    return <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <Header />
        <div className="flex-1 flex justify-center items-center p-4 overflow-auto">
            <div className="w-full max-w-7xl flex gap-6 min-h-0">
                {/* Test Users Credentials Table */}
                <div className="w-1/2">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-xl text-white">👥</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Test User Credentials</h2>
                            <p className="text-sm text-gray-600">Use these demo accounts to test the application</p>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => {setUsername('sid.raj@quickpe.com'); setPassword('demo123');}}>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center">
                                                <div className="w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">S</div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">Sid Raj</div>
                                                    <div className="text-xs text-gray-500">User 1</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-mono">sid.raj@quickpe.com</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-mono">demo123</td>
                                        <td className="px-3 py-2 text-xs font-medium text-green-600">₹15,000</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => {setUsername('siddharth.sinha@quickpe.com'); setPassword('demo123');}}>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center">
                                                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">S</div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">Siddharth Sinha</div>
                                                    <div className="text-xs text-gray-500">User 2</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-mono">siddharth.sinha@quickpe.com</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-mono">demo123</td>
                                        <td className="px-3 py-2 text-xs font-medium text-green-600">₹12,000</td>
                                    </tr>
                                    <tr className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => {setUsername('harsh.raj@quickpe.com'); setPassword('demo123');}}>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center">
                                                <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">H</div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">Harsh Raj</div>
                                                    <div className="text-xs text-gray-500">User 3</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-mono">harsh.raj@quickpe.com</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 font-mono">demo123</td>
                                        <td className="px-3 py-2 text-xs font-medium text-green-600">₹18,000</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-xs font-semibold text-blue-900 mb-2 flex items-center">
                                <span className="mr-1">🧪</span>
                                Testing Instructions
                            </h3>
                            <div className="space-y-1 text-xs text-blue-800">
                                <div className="flex items-start">
                                    <span className="font-semibold mr-1 text-blue-600">1.</span>
                                    <span>Tap on any user to autofill the username and password</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="font-semibold mr-1 text-blue-600">2.</span>
                                    <span>Login as <strong>Sid Raj</strong> → send money to <strong>Siddharth Sinha</strong></span>
                                </div>
                                <div className="flex items-start">
                                    <span className="font-semibold mr-1 text-blue-600">3.</span>
                                    <span>After sending money, login to <strong>User 2</strong> account to see notifications and verify money received</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="font-semibold mr-1 text-blue-600">4.</span>
                                    <span>Test transaction search using ID and apply date filters in transaction history</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="font-semibold mr-1 text-blue-600">5.</span>
                                    <span>Download PDF statements to verify transaction records</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form */}
                <div className="w-1/2">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-white">🔐</span>
                        </div>
                        <Heading label={"Welcome Back"} />
                        <SubHeading label={"Enter your credentials to access your account"} />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <InputBox 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="john@example.com" 
                            label={"Email"} 
                            type="email"
                            error={validationErrors.username}
                            required
                            value={username}
                        />
                        <InputBox 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Enter password" 
                            label={"Password"} 
                            type="password"
                            error={validationErrors.password}
                            required
                            value={password}
                        />
                    </div>

                    <div className="mt-6">
                        <Button 
                            onClick={handleSignin} 
                            label={loading ? "Signing in..." : "Sign in"} 
                            disabled={loading}
                        />
                    </div>
                    
                    <BottomWarning 
                        label={"Don't have an account?"} 
                        buttonText={"Sign up"} 
                        to={"/signup"} 
                    />
                </div>
                </div>
            </div>
        </div>
        <Footer />
    </div>
}