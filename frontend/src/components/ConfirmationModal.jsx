import { Button } from './Button';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, transaction, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">⚠️</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Transfer</h3>
                    <p className="text-gray-600">Please review the transaction details</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">To:</span>
                            <span className="font-semibold text-gray-900">{transaction.recipientName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-bold text-2xl text-green-600">
                                ₹{transaction.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="border-t pt-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Transaction Fee:</span>
                                <span className="text-gray-500">₹0.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <Button
                        onClick={onClose}
                        label="Cancel"
                        variant="secondary"
                        disabled={loading}
                    />
                    <Button
                        onClick={onConfirm}
                        label={loading ? "Processing..." : "Confirm Transfer"}
                        variant="danger"
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
};
