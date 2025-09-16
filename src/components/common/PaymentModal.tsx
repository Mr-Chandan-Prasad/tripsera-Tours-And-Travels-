import React, { useState } from 'react';
import { X, CreditCard, Smartphone, QrCode, Upload } from 'lucide-react';
import { useLocalStorageQuery } from '../../hooks/useLocalStorage';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingId: string;
  onPaymentComplete: (paymentData: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  bookingId,
  onPaymentComplete
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'qr'>('qr');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiId, setUpiId] = useState('');
  const { data: settings } = useLocalStorageQuery('siteSettings', []);
  
  // Get QR code from localStorage
  const qrCodeData = localStorage.getItem('paymentQrCodeData') || '';

  if (!isOpen) return null;

  const handlePaymentSubmit = () => {
    const paymentData = {
      method: selectedMethod,
      amount,
      bookingId,
      paymentProof: paymentProof ? URL.createObjectURL(paymentProof) : null,
      ...(selectedMethod === 'card' && { cardDetails }),
      ...(selectedMethod === 'upi' && { upiId }),
      timestamp: new Date().toISOString()
    };

    onPaymentComplete(paymentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-600">Booking ID: {bookingId}</p>
          <p className="text-3xl font-bold text-teal-600">₹{amount.toLocaleString()}</p>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4">Select Payment Method</h4>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedMethod('qr')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMethod === 'qr' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <QrCode className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <span className="text-sm font-medium">QR Code</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('upi')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMethod === 'upi' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <span className="text-sm font-medium">UPI</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('card')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMethod === 'card' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <span className="text-sm font-medium">Card</span>
            </button>
          </div>
        </div>

        {/* Payment Method Forms */}
        {selectedMethod === 'qr' && (
          <div className="mb-6">
            <div className="text-center">
              {qrCodeData ? (
                <div className="w-48 h-48 mx-auto mb-4">
                  <img 
                    src={qrCodeData} 
                    alt="Payment QR Code" 
                    className="w-full h-full object-contain rounded-lg border-2 border-gray-200"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">QR Code not available</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600">Scan QR code with any UPI app</p>
            </div>
          </div>
        )}

        {selectedMethod === 'upi' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        )}

        {selectedMethod === 'card' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                value={cardDetails.number}
                onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry
                </label>
                <input
                  type="text"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardDetails.name}
                onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Payment Proof Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Payment Proof (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
              className="hidden"
              id="payment-proof"
            />
            <label htmlFor="payment-proof" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {paymentProof ? paymentProof.name : 'Click to upload screenshot'}
              </p>
            </label>
          </div>
        </div>

        <button
          onClick={handlePaymentSubmit}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Complete Payment
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;