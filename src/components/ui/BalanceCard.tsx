import { motion } from 'framer-motion';
import { Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from './button';

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const { balance, transactions } = useWallet();

  const recentCredits = transactions
    .filter((t) => t.type === 'credit' && t.status === 'success')
    .slice(0, 1);
  
  const recentDebits = transactions
    .filter((t) => t.type !== 'credit' && t.status === 'success')
    .slice(0, 1);

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium opacity-90">Demo Wallet Balance</span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        <div className="mb-6">
          <motion.span
            className="text-4xl font-display font-bold"
            key={showBalance ? 'visible' : 'hidden'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {showBalance ? `₹${balance.toLocaleString('en-IN')}` : '₹••••••'}
          </motion.span>
          <p className="text-xs mt-1 opacity-75">Prototype - No real money</p>
        </div>

        <div className="flex gap-3">
          <Button
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Money
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-white/30 text-white hover:bg-white/10"
          >
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Transfer
          </Button>
        </div>
      </div>

      {/* Mini transaction summary */}
      <div className="relative z-10 mt-4 pt-4 border-t border-white/20 flex gap-4">
        {recentDebits.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpRight className="w-3 h-3 text-red-300" />
            <span className="opacity-75">Last spent:</span>
            <span className="font-medium">₹{recentDebits[0].amount}</span>
          </div>
        )}
        {recentCredits.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <ArrowDownLeft className="w-3 h-3 text-green-300" />
            <span className="opacity-75">Last credited:</span>
            <span className="font-medium">₹{recentCredits[0].amount}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
