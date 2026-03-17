import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, X, Thermometer, History, ArrowLeft, LogOut, MapPin, Clock, Delete, AlertTriangle } from 'lucide-react';
import { PalmScanner } from '@/components/ui/PalmScanner';
import { Button } from '@/components/ui/button';
import { usePalm } from '@/contexts/PalmContext';
import { useWallet } from '@/contexts/WalletContext';
import { useHealth } from '@/contexts/HealthContext';
import { usePin } from '@/contexts/PinContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { PalmVeinIcon, PalmVeinIconSimple } from '@/components/ui/PalmVeinIcon';
import palmLogo from '@/assets/palm-iq-logo.png';

type TerminalMode = 'customer' | 'merchant';
type TerminalState = 'idle' | 'pin-entry' | 'amount-entry' | 'scanning' | 'payment-pin' | 'processing' | 'success' | 'failed' | 'history';

const MERCHANT_PIN = '1234'; // Demo PIN
const DEMO_LOCATION = 'Mumbai, MH';

export default function TerminalPage() {
  const navigate = useNavigate();
  const { scanPalm, isRegistered, isHardwareConnected } = usePalm();
  const { balance, deductBalance, addTransaction, transactions } = useWallet();
  const { addReading } = useHealth();
  const { verifyPin } = usePin();

  const [mode, setMode] = useState<TerminalMode>('customer');
  const [state, setState] = useState<TerminalState>('idle');
  const [pin, setPin] = useState('');
  const [paymentPin, setPaymentPin] = useState('');
  const [amount, setAmount] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [temperature, setTemperature] = useState<number | undefined>();
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [healthData, setHealthData] = useState<{ heartRate: number; spo2: number; stressLevel: number } | null>(null);
  const [palmMatchResult, setPalmMatchResult] = useState<boolean>(false);
  const [pinAttempts, setPinAttempts] = useState(0);

  const numericAmount = parseFloat(amount) || 0;

  // Reset to customer mode after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (mode === 'merchant' && state === 'idle') {
      timeout = setTimeout(() => {
        setMode('customer');
        setState('idle');
      }, 120000); // 2 minutes
    }
    return () => clearTimeout(timeout);
  }, [mode, state]);

  const handleKeyPress = (key: string) => {
    if (state === 'pin-entry') {
      if (key === 'clear') {
        setPin('');
      } else if (key === 'backspace') {
        setPin((prev) => prev.slice(0, -1));
      } else if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        
        if (newPin.length === 4) {
          if (newPin === MERCHANT_PIN) {
            setMode('merchant');
            setState('amount-entry');
            setPin('');
            setError('');
          } else {
            setError('Invalid PIN');
            setTimeout(() => {
              setPin('');
              setError('');
            }, 1500);
          }
        }
      }
    } else if (state === 'amount-entry') {
      if (key === 'clear') {
        setAmount('');
      } else if (key === 'backspace') {
        setAmount((prev) => prev.slice(0, -1));
      } else if (key === '.' && !amount.includes('.')) {
        setAmount((prev) => prev + '.');
      } else if (key !== '.' && amount.length < 10) {
        setAmount((prev) => prev + key);
      }
    } else if (state === 'payment-pin') {
      if (key === 'delete') {
        setPaymentPin((prev) => prev.slice(0, -1));
      } else if (paymentPin.length < 4) {
        const newPin = paymentPin + key;
        setPaymentPin(newPin);
        
        // Auto-submit when 4 digits entered
        if (newPin.length === 4) {
          handleVerifyPaymentPin(newPin);
        }
      }
    }
  };

  const handleBack = () => {
    if (state === 'pin-entry') {
      setState('idle');
      setPin('');
    } else if (state === 'amount-entry') {
      handleExitMerchantMode();
    } else if (state === 'scanning') {
      setState('amount-entry');
      setScanStatus('idle');
    } else if (state === 'payment-pin') {
      setState('scanning');
      setPaymentPin('');
      setScanStatus('idle');
    } else if (state === 'history') {
      setState('amount-entry');
    }
  };

  const handleMerchantAccess = () => {
    setState('pin-entry');
    setPin('');
    setError('');
  };

  const handleProceedToPayment = () => {
    if (numericAmount <= 0) return;
    setState('scanning');
    setScanStatus('idle');
    setPalmMatchResult(false);
  };

  const handleStartScan = async () => {
    // IMPORTANT: Require real hardware connection for Palm Pay
    if (!isHardwareConnected) {
      setPaymentError('Palm scanner hardware not connected. Please connect the Palm IQ device.');
      setState('failed');
      return;
    }

    if (!isRegistered) {
      setPaymentError('No palm registered. User must register their palm first.');
      setState('failed');
      return;
    }

    setScanStatus('scanning');
    setPaymentError('');

    try {
      const result = await scanPalm();
      
      if (result.error) {
        setScanStatus('failed');
        setState('failed');
        setPaymentError(result.error);
        setTransactionId(`TXN${Date.now().toString(36).toUpperCase()}`);
        return;
      }
      
      setTemperature(result.temperature);

      const newHealthData = {
        heartRate: 65 + Math.floor(Math.random() * 25),
        spo2: 96 + Math.floor(Math.random() * 4),
        stressLevel: 2 + Math.floor(Math.random() * 4),
      };
      setHealthData(newHealthData);

      // Add health reading
      addReading({
        temperature: result.temperature,
        heartRate: newHealthData.heartRate,
        spo2: newHealthData.spo2,
        stressLevel: newHealthData.stressLevel,
      });

      if (result.matched) {
        // Palm matched! Now require PIN verification
        setScanStatus('success');
        setPalmMatchResult(true);
        setPaymentPin('');
        setPinAttempts(0);
        
        // Move to PIN entry step
        setTimeout(() => {
          setState('payment-pin');
        }, 1000);
      } else {
        // Palm did NOT match - FAIL immediately, do NOT ask for PIN
        setScanStatus('failed');
        setState('failed');
        setTransactionId(`TXN${Date.now().toString(36).toUpperCase()}`);
        setPaymentError('Palm verification failed. Your palm does not match any registered palm.');
      }
    } catch (error) {
      setScanStatus('failed');
      setState('failed');
      setPaymentError('An unexpected error occurred. Please try again.');
    }
  };

  const handleVerifyPaymentPin = async (pinToVerify: string) => {
    if (!verifyPin(pinToVerify)) {
      setPinAttempts(prev => prev + 1);
      setPaymentPin('');
      
      if (pinAttempts >= 2) {
        // Too many attempts - fail
        setState('failed');
        setPaymentError('Too many incorrect PIN attempts. Transaction cancelled.');
        setTransactionId(`TXN${Date.now().toString(36).toUpperCase()}`);
      } else {
        setError(`Incorrect PIN. ${2 - pinAttempts} attempts remaining.`);
        setTimeout(() => setError(''), 2000);
      }
      return;
    }

    // PIN verified! Process payment
    setError('');
    setState('processing');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const success = deductBalance(numericAmount);
    const txnId = `TXN${Date.now().toString(36).toUpperCase()}`;
    setTransactionId(txnId);

    if (success) {
      addTransaction({
        type: 'palm_pay',
        amount: numericAmount,
        merchant: 'Terminal Payment',
        description: 'Palm Pay - Terminal',
        status: 'success',
        location: DEMO_LOCATION,
        temperature: temperature,
      });
      setState('success');
    } else {
      setState('failed');
      setPaymentError('Insufficient balance');
    }
  };

  const handleNewTransaction = () => {
    setState('amount-entry');
    setAmount('');
    setScanStatus('idle');
    setTemperature(undefined);
    setTransactionId('');
    setHealthData(null);
    setPaymentError('');
    setPalmMatchResult(false);
    setPaymentPin('');
    setPinAttempts(0);
  };

  const handleExitMerchantMode = () => {
    setMode('customer');
    setState('idle');
    setAmount('');
    setPin('');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const merchantTransactions = transactions.filter(t => t.type === 'palm_pay').slice(0, 10);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Terminal Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {(state === 'pin-entry' || state === 'scanning' || state === 'payment-pin' || state === 'history' || (state === 'amount-entry' && mode === 'merchant')) && (
            <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {state === 'idle' && mode === 'customer' && (
            <button onClick={handleGoHome} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <img src={palmLogo} alt="Palm IQ" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="font-display font-bold text-lg">Palm IQ Terminal</h1>
            <p className="text-xs text-muted-foreground">
              {mode === 'merchant' ? 'Merchant Mode' : 'Ready for Payment'}
            </p>
          </div>
        </div>
        
        {mode === 'merchant' && state !== 'scanning' && state !== 'payment-pin' && state !== 'processing' && state !== 'success' && state !== 'failed' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState('history')}
              className="text-muted-foreground"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitMerchantMode}
              className="text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* Customer Idle Screen */}
          {state === 'idle' && mode === 'customer' && (
            <motion.div
              key="customer-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-8"
              >
                <PalmVeinIcon size={100} animate />
              </motion.div>
              <h2 className="text-3xl font-display font-bold mb-4">Welcome to Palm IQ</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Contact merchant to initiate payment
              </p>
              <div className="px-6 py-3 rounded-full bg-muted text-muted-foreground text-sm mb-8">
                Prototype – No real money involved
              </div>
              
              <Button
                onClick={handleMerchantAccess}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-8 py-6 text-lg border-primary/50 hover:bg-primary/10"
              >
                <Lock className="w-5 h-5" />
                Merchant Login
              </Button>
            </motion.div>
          )}

          {/* Merchant PIN Entry */}
          {state === 'pin-entry' && (
            <motion.div
              key="pin-entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <Lock className="w-16 h-16 text-primary mb-6" />
                <p className="text-lg mb-6 text-muted-foreground">Enter Merchant PIN</p>
                
                <div className="flex gap-4 mb-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full border-2 ${
                        pin.length > i ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-destructive text-sm mb-4">{error}</p>
                )}

                <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      className="keypad-btn"
                    >
                      {key === 'backspace' ? '⌫' : key === 'clear' ? 'C' : key}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Amount Entry */}
          {state === 'amount-entry' && mode === 'merchant' && (
            <motion.div
              key="amount-entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <p className="text-muted-foreground mb-2">Enter Payment Amount</p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-display font-bold text-muted-foreground">₹</span>
                  <span className="text-7xl font-display font-bold">
                    {amount || '0'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
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
                  onClick={handleProceedToPayment}
                  disabled={numericAmount <= 0}
                  className="w-full max-w-xs h-14 text-lg font-semibold btn-gradient"
                >
                  Proceed to Pay
                </Button>
              </div>
            </motion.div>
          )}

          {/* Palm Scanning Screen */}
          {state === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <div className="text-center mb-8">
                <p className="text-muted-foreground mb-2">Amount to Pay</p>
                <p className="text-5xl font-display font-bold">₹{numericAmount.toLocaleString('en-IN')}</p>
              </div>

              <PalmScanner 
                status={scanStatus} 
                temperature={temperature}
                onScan={handleStartScan}
              />

              <p className="mt-8 text-lg text-muted-foreground">
                {scanStatus === 'idle' ? 'Tap to scan palm' : 'Verifying palm...'}
              </p>

              {/* Hardware/Registration Warnings */}
              {!isHardwareConnected && scanStatus === 'idle' && (
                <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <p className="text-sm text-destructive">
                    Palm scanner not connected. Real hardware required for Palm Pay.
                  </p>
                </div>
              )}

              {isHardwareConnected && !isRegistered && scanStatus === 'idle' && (
                <div className="mt-4 p-4 rounded-xl bg-palm-warning/10 border border-palm-warning/30 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-palm-warning" />
                  <p className="text-sm text-palm-warning">
                    No palm registered. User must register first.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Payment PIN Entry (After Palm Match) */}
          {state === 'payment-pin' && (
            <motion.div
              key="payment-pin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-full bg-palm-success/20 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-palm-success" />
                </div>
                <p className="text-palm-success font-medium mb-2">Palm Verified ✓</p>
                <p className="text-2xl font-display font-bold mb-6">₹{numericAmount.toLocaleString('en-IN')}</p>
                
                <p className="text-muted-foreground mb-4">Enter Payment PIN to confirm</p>
                
                <div className="flex gap-4 mb-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-colors ${
                        paymentPin.length > i 
                          ? 'bg-primary border-primary' 
                          : error 
                            ? 'border-destructive' 
                            : 'border-muted-foreground'
                      }`}
                      animate={error && i < paymentPin.length ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    />
                  ))}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm mb-4"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => (
                    <motion.button
                      key={key}
                      className={`keypad-btn ${key === 'delete' ? 'text-destructive' : ''} ${!key ? 'invisible' : ''}`}
                      onClick={() => key && handleKeyPress(key)}
                      whileTap={{ scale: 0.9 }}
                      disabled={!key || pinAttempts >= 3}
                    >
                      {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
                    </motion.button>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">Default PIN: 1234</p>
              </div>
            </motion.div>
          )}

          {/* Processing */}
          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin mb-8" />
              <p className="text-xl font-medium">Processing Payment...</p>
            </motion.div>
          )}

          {/* Success Screen */}
          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-palm-success flex items-center justify-center mb-6 shadow-glow-success"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>

              <h1 className="text-2xl font-display font-bold mb-2">Payment Successful!</h1>
              <p className="text-4xl font-display font-bold text-palm-success mb-4">
                ₹{numericAmount.toLocaleString('en-IN')}
              </p>

              <div className="w-full max-w-sm space-y-2 text-sm mb-6">
                <div className="flex justify-between p-3 rounded-xl bg-secondary">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono font-medium">{transactionId}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time
                  </span>
                  <span>{format(new Date(), 'dd MMM yyyy, HH:mm')}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </span>
                  <span>{DEMO_LOCATION}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-palm-health" /> Temperature
                  </span>
                  <span>{temperature}°C</span>
                </div>
                {healthData && (
                  <>
                    <div className="flex justify-between p-3 rounded-xl bg-secondary">
                      <span className="text-muted-foreground">Heart Rate</span>
                      <span>{healthData.heartRate} bpm</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-secondary">
                      <span className="text-muted-foreground">SpO2</span>
                      <span>{healthData.spo2}%</span>
                    </div>
                  </>
                )}
              </div>

              <div className="px-4 py-2 rounded-full bg-palm-success/20 text-palm-success text-xs mb-4">
                ✓ Palm + PIN Verified
              </div>

              <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-xs mb-4">
                Prototype – No real money involved
              </div>

              {mode === 'merchant' && (
                <Button onClick={handleNewTransaction} className="w-full max-w-sm btn-gradient">
                  New Transaction
                </Button>
              )}
            </motion.div>
          )}

          {/* Failed Screen */}
          {state === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
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
              <p className="text-lg text-muted-foreground mb-6">
                {paymentError || 'Palm verification failed or insufficient balance'}
              </p>

              <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-xs mb-6">
                Prototype – No real money involved
              </div>

              {mode === 'merchant' && (
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleNewTransaction}>
                    Try Again
                  </Button>
                  <Button onClick={handleExitMerchantMode}>
                    Exit
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Transaction History */}
          {state === 'history' && mode === 'merchant' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-display font-semibold">Palm Pay Transactions</h2>
                <p className="text-sm text-muted-foreground">Recent terminal payments</p>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-2">
                {merchantTransactions.length > 0 ? (
                  merchantTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <PalmVeinIconSimple size={20} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{txn.merchant || 'Palm Pay'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(txn.timestamp), 'dd MMM, HH:mm')}</span>
                          {txn.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {txn.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{txn.amount.toLocaleString('en-IN')}</p>
                        {txn.temperature && (
                          <p className="text-xs text-muted-foreground">{txn.temperature}°C</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Terminal Footer */}
      <footer className="p-4 border-t border-border bg-card text-center">
        <p className="text-xs text-muted-foreground">
          Palm IQ Terminal v1.0 • Palm + PIN Required
        </p>
      </footer>
    </div>
  );
}
