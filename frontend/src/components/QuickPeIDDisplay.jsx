import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentDuplicateIcon,
  CheckIcon,
  QrCodeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

export const QuickPeIDDisplay = ({ quickpeId, userName, showQR = true, size = 'medium' }) => {
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const sizes = {
    small: {
      container: 'px-3 py-2',
      text: 'text-sm',
      icon: 'h-4 w-4'
    },
    medium: {
      container: 'px-4 py-3',
      text: 'text-base',
      icon: 'h-5 w-5'
    },
    large: {
      container: 'px-6 py-4',
      text: 'text-lg',
      icon: 'h-6 w-6'
    }
  };

  const currentSize = sizes[size] || sizes.medium;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(quickpeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        quickpeId,
        userName,
        type: 'quickpe_payment'
      });
      
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#059669',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(url);
      setShowQRCode(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const shareQuickPeID = async () => {
    const shareData = {
      title: 'My QuickPe ID',
      text: `Send money to ${userName} using QuickPe ID: ${quickpeId}`,
      url: `https://quickpe.com/pay/${quickpeId}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyToClipboard();
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main QuickPe ID Display */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl overflow-hidden">
        <div className={`flex items-center justify-between ${currentSize.container}`}>
          <div className="flex-1">
            <div className="text-xs text-emerald-700 font-medium mb-1 uppercase tracking-wide">
              QuickPe ID
            </div>
            <div className={`font-mono font-bold text-emerald-900 ${currentSize.text} tracking-wider`}>
              {quickpeId}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Copy Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyToClipboard}
              className={`flex items-center space-x-1 ${currentSize.container} bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm`}
              title="Copy QuickPe ID"
            >
              {copied ? (
                <>
                  <CheckIcon className={currentSize.icon} />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className={currentSize.icon} />
                  <span className="text-sm font-medium">Copy</span>
                </>
              )}
            </motion.button>

            {/* QR Code Button */}
            {showQR && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateQRCode}
                className={`${currentSize.container} bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors`}
                title="Show QR Code"
              >
                <QrCodeIcon className={currentSize.icon} />
              </motion.button>
            )}

            {/* Share Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shareQuickPeID}
              className={`${currentSize.container} bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors`}
              title="Share QuickPe ID"
            >
              <ShareIcon className={currentSize.icon} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-emerald-200 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Scan to Pay</h3>
            <button
              onClick={() => setShowQRCode(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QuickPe QR Code" className="w-64 h-64" />
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">QuickPe ID</div>
              <div className="font-mono font-bold text-emerald-900 text-lg">
                {quickpeId}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {userName}
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              <span>{copied ? 'Copied!' : 'Copy QuickPe ID'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-500 text-center">
        Share this ID with others to receive money instantly
      </div>
    </div>
  );
};

export default QuickPeIDDisplay;
