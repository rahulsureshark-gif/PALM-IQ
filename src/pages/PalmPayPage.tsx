import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PalmScanner } from '@/components/ui/PalmScanner';
import { Button } from '@/components/ui/button';
import { usePalm } from '@/contexts/PalmContext';
import { useWallet } from '@/contexts/WalletContext';
import { useHealth } from '@/contexts/HealthContext';

type PaymentState = 'amount' | 'scanning' | 'processing' | 'success' | 'failed';

export default function PalmPayPage() {
  const navigate = useNavigate();
  const { scanPalm, isRegistered, isHardwareConnected } = usePalm();
  const { balance, deductBalance, addTransaction } = useWallet();
  const { addReading } = useHealth();

  const [state, setState] = useState<PaymentState>('amount');
  const [amount, setAmount] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [temperature, setTemperature] = useState<number | undefined>();
  const [transactionId, setTransactionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const numericAmount = parseFloat(amount) || 0;
  const canPay = numericAmount > 0 && numericAmount <= balance && isRegistered && isHardwareConnected;

  const handleKeyPress = (key: string) => {
    if (key === 'clear') {
      setAmount('');
    } else if (key === 'backspace') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => prev + '.');
      }
    } else {
      if (amount.length < 8) {
        setAmount((prev) => prev + key);
      }
    }
  };

  const handleStartPayment = async () => {
    if (!canPay) return;
    
    setState('scanning');
    setScanStatus('scanning');
    setErrorMessage('');

    try {
      const result = await scanPalm();
      
      if (result.error) {
        setScanStatus('failed');
        setState('failed');
        setErrorMessage(result.error);
        return;
      }
      
      setTemperature(result.temperature);
      
      // Add health reading
      addReading({
        temperature: result.temperature,
        heartRate: 65 + Math.floor(Math.random() * 25),
        spo2: 96 + Math.floor(Math.random() * 4),
        stressLevel: 2 + Math.floor(Math.random() * 4),
      });

      if (result.matched) {
        setScanStatus('success');
        setState('processing');
        
        // Process payment
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const success = deductBalance(numericAmount);
        const txnId = `TXN${Date.now().toString(36).toUpperCase()}`;
        setTransactionId(txnId);

        if (success) {
          addTransaction({
            type: 'palm_pay',
            amount: numericAmount,
            merchant: 'Demo Merchant',
            description: 'Palm Pay Transaction',
            status: 'success',
            location: 'Demo Location',
            temperature: result.temperature,
          });
          setState('success');
        } else {
          setState('failed');
          setErrorMessage('Insufficient balance');
        }
      } else {
        setScanStatus('failed');
        setState('failed');
        setTransactionId(`TXN${Date.now().toString(36).toUpperCase()}`);
        setErrorMessage('Palm verification failed. Your palm does not match.');
      }
    } catch (error) {
      setScanStatus('failed');
      setState('failed');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleReset = () => {
    setState('amount');
    setAmount('');
    setScanStatus('idle');
    setTemperature(undefined);
    setTransactionId('');
    setErrorMessage('');
  };

  if (!isRegistered || !isHardwareConnected) {
    return (
      <MobileLayout hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 rounded-full bg-palm-warning/20 mb-6">
            <AlertTriangle className="w-12 h-12 text-palm-warning" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">
            {!isHardwareConnected ? 'Hardware Not Connected' : 'Palm Not Registered'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {!isHardwareConnected 
              ? 'Please connect the Palm IQ scanner device to use Palm Pay.'
              : 'You need to register your palm before using Palm Pay.'
            }
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
            {isHardwareConnected && (
              <Button onClick={() => navigate('/palm-register')}>
                Register Palm
              </Button>
            )}
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <AnimatePresence mode="wait">
        {/* Amount Entry */}
        {state === 'amount' && (
          <motion.div
            key="amount"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center p-4 border-b border-border">
              <button
                onClick={() => navigate('/')}
                className="p-2 -ml-2 rounded-lg hover:bg-secondary"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="ml-2 font-display font-semibold text-lg">Palm Pay</h1>
            </div>

            {/* Amount display */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <p className="text-muted-foreground mb-2">Enter amount</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold text-muted-foreground">₹</span>
                <span className="text-6xl font-display font-bold">
                  {amount || '0'}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Balance: ₹{balance.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Keypad */}
            <div className="p-4 bg-card border-t border-border">
              <div className="grid grid-cols-3 gap-3 mb-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className="keypad-btn"
                  >
                    {key === 'backspace' ? '⌫' : key}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleStartPayment}
                disabled={!canPay}
                className="w-full h-14 text-lg font-semibold"
              >
                {numericAmount > balance ? 'Insufficient Balance' : 'Proceed to Pay'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Scanning & Processing */}
        {(state === 'scanning' || state === 'processing') && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center mb-8"
            >
              <p className="text-muted-foreground mb-2">Amount to pay</p>
              <p className="text-4xl font-display font-bold">₹{numericAmount.toLocaleString('en-IN')}</p>
            </motion.div>

            <PalmScanner status={scanStatus} temperature={temperature} />

            <p className="mt-8 text-muted-foreground text-center">
              {state === 'scanning' ? 'Place your palm on the scanner' : 'Processing payment...'}
            </p>
          </motion.div>
        )}

        {/* Success */}
        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-palm-success flex items-center justify-center mb-6 shadow-glow"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-display font-bold mb-2">Payment Successful!</h1>
            <p className="text-4xl font-display font-bold text-palm-success mb-4">
              ₹{numericAmount.toLocaleString('en-IN')}
            </p>
            
            <div className="w-full max-w-xs space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between p-3 rounded-lg bg-secondary">
                <span>Transaction ID</span>
                <span className="font-mono">{transactionId}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-secondary">
                <span>Temperature</span>
                <span>{temperature}°C</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-secondary">
                <span>Status</span>
                <span className="text-palm-success">Completed</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-full">
              Prototype – No real money involved
            </p>

            <Button onClick={handleReset} className="mt-8 w-full max-w-xs">
              Done
            </Button>
          </motion.div>
        )}

        {/* Failed */}
        {state === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-destructive flex items-center justify-center mb-6"
            >
              <X className="w-12 h-12 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-display font-bold mb-2">Payment Failed</h1>
            <p className="text-muted-foreground mb-4">
              {errorMessage || 'Palm verification failed or payment could not be processed.'}
            </p>
            
            <p className="mt-4 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-full">
              Prototype – No real money involved
            </p>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button onClick={handleReset}>
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
