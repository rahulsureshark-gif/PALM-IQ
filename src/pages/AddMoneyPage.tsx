import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Building, Smartphone, CheckCircle, Plus, Delete } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';

const quickAmounts = [500, 1000, 2000, 5000];

const paymentMethods = [
  { id: 'upi', icon: Smartphone, label: 'UPI', description: 'Google Pay, PhonePe, etc.' },
  { id: 'card', icon: CreditCard, label: 'Debit/Credit Card', description: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', icon: Building, label: 'Net Banking', description: 'All major banks' },
];

export default function AddMoneyPage() {
  const navigate = useNavigate();
  const { balance, addBalance, addTransaction } = useWallet();
  
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      if (amount.length < 7) {
        setAmount(prev => prev + key);
      }
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleAddMoney = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    addBalance(numAmount);
    addTransaction({
      type: 'credit',
      amount: numAmount,
      description: `Added via ${paymentMethods.find(m => m.id === selectedMethod)?.label}`,
      status: 'success',
    });
    
    setIsProcessing(false);
    setIsSuccess(true);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (isSuccess) {
    return (
      <MobileLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-palm-success flex items-center justify-center mb-6 shadow-glow-success"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-2xl font-display font-bold mb-2">Money Added!</h2>
          <p className="text-4xl font-display font-bold gradient-text mb-2">
            {formatCurrency(amount)}
          </p>
          <p className="text-muted-foreground mb-8">
            New balance: {formatCurrency(balance)}
          </p>

          <div className="w-full max-w-xs space-y-3">
            <Button className="w-full" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </motion.div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-semibold text-lg">Add Money</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* Amount Input */}
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">Enter Amount</p>
            <motion.div
              className="text-5xl font-display font-bold gradient-text"
              key={amount}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              {formatCurrency(amount || '0')}
            </motion.div>
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2 justify-center">
            {quickAmounts.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                className={amount === value.toString() ? 'border-primary bg-primary/10' : ''}
                onClick={() => handleQuickAmount(value)}
              >
                +₹{value}
              </Button>
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => (
              key ? (
                <motion.button
                  key={key}
                  className="keypad-btn"
                  onClick={() => handleKeyPress(key)}
                  whileTap={{ scale: 0.9 }}
                >
                  {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
                </motion.button>
              ) : <div key="empty" />
            ))}
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment Method</h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/50 hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedMethod === method.id ? 'bg-primary text-white' : 'bg-secondary'
                  }`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id ? 'border-primary' : 'border-border'
                  }`}>
                    {selectedMethod === method.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Demo Notice */}
          <div className="p-3 rounded-xl bg-palm-info/10 border border-palm-info/30 text-center">
            <p className="text-xs text-palm-info">
              Demo Mode: No real payment will be processed
            </p>
          </div>

          {/* Add Button */}
          <Button
            className="w-full h-14 btn-gradient text-lg"
            disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
            onClick={handleAddMoney}
          >
            {isProcessing ? (
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Add {formatCurrency(amount || '0')}
              </>
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
