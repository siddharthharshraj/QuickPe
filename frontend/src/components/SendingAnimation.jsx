import { motion } from 'framer-motion';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

export const SendingAnimation = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4"
            >
                <div className="text-center">
                    {/* Animated Icon */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center"
                    >
                        <PaperAirplaneIcon className="h-12 w-12 text-white" />
                    </motion.div>

                    {/* Loading Text */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        Sending Money
                    </h3>
                    <p className="text-slate-600 mb-6">
                        Please wait while we process your transaction...
                    </p>

                    {/* Progress Dots */}
                    <div className="flex justify-center space-x-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                                className="w-3 h-3 bg-emerald-600 rounded-full"
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SendingAnimation;
