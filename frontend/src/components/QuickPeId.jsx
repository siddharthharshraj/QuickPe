import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const QuickPeId = () => {
    const [quickpeId, setQuickpeId] = useState("");
    const [userName, setUserName] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setQuickpeId(decoded.quickpeId || "");
                setUserName(`${decoded.firstName} ${decoded.lastName}`.trim());
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }
    }, []);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(quickpeId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = quickpeId;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!quickpeId) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your QuickPe ID</h3>
                    <p className="text-sm text-gray-600">Share this ID to receive money instantly</p>
                </div>
                <div className="text-3xl">💳</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">QuickPe ID for {userName}</div>
                        <div className="text-2xl font-mono font-bold text-purple-600 tracking-wider">
                            {quickpeId}
                        </div>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                            copied 
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                        }`}
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">How to use your QuickPe ID:</p>
                        <ul className="text-xs space-y-1">
                            <li>• Share this ID with anyone who wants to send you money</li>
                            <li>• They can enter this ID in the "Send Money" section</li>
                            <li>• Money will be transferred instantly to your account</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default QuickPeId;
