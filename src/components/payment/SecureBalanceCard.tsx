import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wallet, ArrowDownLeft, Receipt } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { usePin } from '@/contexts/PinContext';
import { PaymentPinModal } from './PaymentPinModal';
import { Link } from 'react-router-dom';

export function SecureBalanceCard() {
  const { balance } = useWallet();
  const { verifyPin } = usePin();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleToggleBalance = () => {
    if (isBalanceVisible) {
      setIsBalanceVisible(false);
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setIsBalanceVisible(true);
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
      setIsBalanceVisible(false);
    }, 30000);
  };

  return (
    <>
      <div className="phonepe-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <span className="text-sm opacity-90">Palm IQ Balance</span>
          </div>
        </div>
        
        {/* Balance with Eye Button - Near rupee symbol for easy tap */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {isBalanceVisible ? (
              <motion.div
                key="visible"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3"
              >
                <h2 className="text-3xl font-display font-bold">
                  {formatCurrency(balance)}
                </h2>
                <button
                  onClick={handleToggleBalance}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Hide balance"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3"
              >
                <h2 className="text-3xl font-display font-bold">₹ ••••••</h2>
                <button
                  onClick={handleToggleBalance}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
                  aria-label="Show balance"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-sm opacity-80 mt-2">
            {isBalanceVisible ? 'Available Balance' : 'Tap eye to view balance'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            to="/add-money"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Add Money
          </Link>
          <Link
            to="/history"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium"
          >
            <Receipt className="w-4 h-4" />
            History
          </Link>
        </div>
      </div>

      <PaymentPinModal
        isOpen={showPinModal}
        amount={0}
        merchantName="View Balance"
        merchantIcon={<Eye className="w-8 h-8 text-primary" />}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
      />
    </>
  );
}
