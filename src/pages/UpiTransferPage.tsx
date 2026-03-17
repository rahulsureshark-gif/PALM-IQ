import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AtSign, CheckCircle, Delete, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentPinModal } from '@/components/payment/PaymentPinModal';

type Step = 'details' | 'amount' | 'pin' | 'processing' | 'success' | 'failed';

export default function UpiTransferPage() {
  const navigate = useNavigate();
  const { balance, deductBalance, addTransaction } = useWallet();

  const [step, setStep] = useState<Step>('details');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setAmount(prev => prev.slice(0, -1));
    } else if (amount.length < 7) {
      setAmount(prev => prev + key);
    }
  };

  const handlePinSuccess = async () => {
    setStep('processing');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const numAmount = parseFloat(amount);
    const success = deductBalance(numAmount);
    
    if (success) {
      addTransaction({
        type: 'demo_transfer',
        amount: numAmount,
        merchant: upiId,
        description: `UPI Transfer to ${upiId}`,
        status: 'success',
      });
      setStep('success');
    } else {
      setError('Insufficient balance for this transfer.');
      setStep('failed');
    }
  };

  const handlePinFailed = (errorMsg: string) => {
    setError(errorMsg);
    setStep('failed');
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const isValidUpi = upiId.includes('@') && upiId.length >= 5;

  return (
    <MobileLayout>
      <AnimatePresence mode="wait">
        {/* Details Step */}
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)]"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="font-display font-semibold text-lg">UPI Transfer</h1>
            </div>

            <div className="p-4 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <AtSign className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Transfer via UPI ID</h3>
                  <p className="text-sm text-muted-foreground">Instant transfer to any UPI</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">UPI ID</label>
                <Input
                  placeholder="example@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the recipient's UPI ID (e.g., name@bank, phone@ybl)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-palm-info/10 border border-palm-info/30 text-center">
                <p className="text-xs text-palm-info">Demo Mode: Simulated UPI transfer</p>
              </div>

              <Button
                className="w-full h-14 btn-gradient"
                disabled={!isValidUpi}
                onClick={() => setStep('amount')}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Amount Step */}
        {step === 'amount' && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)] flex flex-col"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => setStep('details')} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <p className="font-medium text-sm">Sending to</p>
                <p className="text-xs text-muted-foreground">{upiId}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <p className="text-sm text-muted-foreground mb-2">Enter Amount</p>
              <motion.div
                className="text-5xl font-display font-bold gradient-text mb-4"
                key={amount}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                {formatCurrency(amount || '0')}
              </motion.div>
              <p className="text-sm text-muted-foreground">Balance: {formatCurrency(balance)}</p>
            </div>

            <div className="p-4 bg-card border-t border-border">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => (
                  <motion.button
                    key={key}
                    className={`keypad-btn ${key === 'delete' ? 'text-destructive' : ''} ${!key ? 'invisible' : ''}`}
                    onClick={() => key && handleKeyPress(key)}
                    whileTap={{ scale: 0.9 }}
                    disabled={!key}
                  >
                    {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
                  </motion.button>
                ))}
              </div>
              <Button
                className="w-full h-14 btn-gradient text-lg"
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                onClick={() => setStep('pin')}
              >
                Proceed to Pay
              </Button>
            </div>
          </motion.div>
        )}

        {/* PIN Modal - Used instead of inline PIN step */}
        <PaymentPinModal
          isOpen={step === 'pin'}
          amount={parseFloat(amount) || 0}
          merchantName={upiId}
          merchantIcon={<AtSign className="w-8 h-8 text-primary" />}
          onSuccess={handlePinSuccess}
          onCancel={() => setStep('amount')}
          onFailed={handlePinFailed}
        />

        {/* Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6"
          >
            <motion.div
              className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full mb-8"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <h2 className="text-xl font-display font-bold mb-2">Processing Transfer</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </motion.div>
        )}

        {/* Success */}
        {step === 'success' && (
          <motion.div
            key="success"
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

            <h2 className="text-2xl font-display font-bold mb-2">Transfer Successful!</h2>
            <p className="text-4xl font-display font-bold gradient-text mb-2">
              {formatCurrency(amount)}
            </p>
            <p className="text-muted-foreground mb-8">to {upiId}</p>

            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </motion.div>
        )}

        {/* Failed */}
        {step === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-destructive flex items-center justify-center mb-6"
            >
              <AlertCircle className="w-12 h-12 text-white" />
            </motion.div>

            <h2 className="text-2xl font-display font-bold mb-2">Transfer Failed</h2>
            <p className="text-muted-foreground text-center mb-8">{error}</p>

            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full" onClick={() => { setError(''); setStep('amount'); }}>
                Try Again
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/change-pin')}>
                Reset PIN via Email
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
