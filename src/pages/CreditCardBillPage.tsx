import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, CheckCircle, Delete, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useWallet } from '@/contexts/WalletContext';
import { usePin } from '@/contexts/PinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = 'details' | 'amount' | 'pin' | 'processing' | 'success' | 'failed';

const banks = [
  { id: 'hdfc', name: 'HDFC Bank', icon: '🏦' },
  { id: 'icici', name: 'ICICI Bank', icon: '🏛️' },
  { id: 'sbi', name: 'SBI Card', icon: '🏢' },
  { id: 'axis', name: 'Axis Bank', icon: '🏬' },
  { id: 'kotak', name: 'Kotak Bank', icon: '🏪' },
  { id: 'amex', name: 'American Express', icon: '💳' },
];

export default function CreditCardBillPage() {
  const navigate = useNavigate();
  const { balance, deductBalance, addTransaction } = useWallet();
  const { verifyPin } = usePin();

  const [step, setStep] = useState<Step>('details');
  const [selectedBank, setSelectedBank] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setAmount(prev => prev.slice(0, -1));
    } else if (amount.length < 7) {
      setAmount(prev => prev + key);
    }
  };

  const handlePinKeyPress = (key: string) => {
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(prev => prev + key);
    }
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) return;

    if (!verifyPin(pin)) {
      setError('Incorrect PIN. Please try again or reset via email.');
      setStep('failed');
      return;
    }

    setStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const numAmount = parseFloat(amount);
    deductBalance(numAmount);
    
    const bankName = banks.find(b => b.id === selectedBank)?.name || 'Credit Card';
    addTransaction({
      type: 'demo_transfer',
      amount: numAmount,
      merchant: `${bankName} Credit Card`,
      description: `Card ending ****${cardNumber.slice(-4)}`,
      status: 'success',
    });

    setStep('success');
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 16);
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const isValidCard = cardNumber.replace(/\s/g, '').length >= 12 && selectedBank;

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
              <h1 className="font-display font-semibold text-lg">Credit Card Bill</h1>
            </div>

            <div className="p-4 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Pay Credit Card Bill</h3>
                  <p className="text-sm text-muted-foreground">All major banks supported</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Bank</label>
                  <div className="grid grid-cols-2 gap-2">
                    {banks.map((bank) => (
                      <button
                        key={bank.id}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          selectedBank === bank.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedBank(bank.id)}
                      >
                        <span className="text-xl mb-1 block">{bank.icon}</span>
                        <span className="text-sm font-medium">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Card Number</label>
                  <Input
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={formatCardNumber(cardNumber)}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={19}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-palm-info/10 border border-palm-info/30 text-center">
                <p className="text-xs text-palm-info">Demo Mode: Simulated bill payment</p>
              </div>

              <Button
                className="w-full h-14 btn-gradient"
                disabled={!isValidCard}
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
                <p className="font-medium text-sm">{banks.find(b => b.id === selectedBank)?.name}</p>
                <p className="text-xs text-muted-foreground">****{cardNumber.slice(-4)}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <p className="text-sm text-muted-foreground mb-2">Enter Bill Amount</p>
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

        {/* PIN Step */}
        {step === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)] flex flex-col"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => { setStep('amount'); setPin(''); }} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="font-display font-semibold text-lg">Enter Payment PIN</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">{banks.find(b => b.id === selectedBank)?.name}</p>
              <p className="text-2xl font-display font-bold mb-8">{formatCurrency(amount)}</p>
              
              <div className="flex gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      pin.length > i ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 bg-card border-t border-border">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => (
                  <motion.button
                    key={key}
                    className={`keypad-btn ${key === 'delete' ? 'text-destructive' : ''} ${!key ? 'invisible' : ''}`}
                    onClick={() => key && handlePinKeyPress(key)}
                    whileTap={{ scale: 0.9 }}
                    disabled={!key}
                  >
                    {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
                  </motion.button>
                ))}
              </div>
              <Button
                className="w-full h-14 btn-gradient text-lg"
                disabled={pin.length !== 4}
                onClick={handleVerifyPin}
              >
                Confirm Payment
              </Button>
            </div>
          </motion.div>
        )}

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
            <h2 className="text-xl font-display font-bold mb-2">Processing Payment</h2>
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

            <h2 className="text-2xl font-display font-bold mb-2">Payment Successful!</h2>
            <p className="text-4xl font-display font-bold gradient-text mb-2">
              {formatCurrency(amount)}
            </p>
            <p className="text-muted-foreground mb-8">
              {banks.find(b => b.id === selectedBank)?.name} - ****{cardNumber.slice(-4)}
            </p>

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

            <h2 className="text-2xl font-display font-bold mb-2">Payment Failed</h2>
            <p className="text-muted-foreground text-center mb-8">{error}</p>

            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full" onClick={() => { setPin(''); setStep('pin'); }}>
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
