import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, User, CheckCircle, Delete, AlertCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { PaymentPinModal } from '@/components/payment/PaymentPinModal';

type Step = 'input' | 'amount' | 'pin' | 'processing' | 'success' | 'failed';

export default function ContactTransferPage() {
  const navigate = useNavigate();
  const { balance, sendToPhone, phoneNumber: myPhoneNumber } = useWallet();

  const [step, setStep] = useState<Step>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedContact, setSelectedContact] = useState<{ name: string; phone: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [receiverName, setReceiverName] = useState('');

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
  };

  const handleContinueWithPhone = async () => {
    if (phoneNumber.length !== 10) return;
    
    // Check if sending to self
    if (phoneNumber === myPhoneNumber) {
      setError('Cannot send money to yourself');
      return;
    }
    
    setIsSearching(true);
    setError('');
    
    try {
      // Local-only: just accept the phone number (demo mode)
      setSelectedContact({ name: `User (${phoneNumber})`, phone: phoneNumber });
      setReceiverName(`User (${phoneNumber})`);
      setStep('amount');
    } catch (err) {
      setError('Failed to find user. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setAmount(prev => prev.slice(0, -1));
    } else if (amount.length < 7) {
      setAmount(prev => prev + key);
    }
  };

  const handlePinSuccess = async () => {
    setStep('processing');

    const numAmount = parseFloat(amount);

    // Execute P2P transfer (falls back to local demo if backend denies permissions)
    const result = await sendToPhone(phoneNumber, numAmount);

    if (result.success) {
      setReceiverName(result.receiverName || selectedContact?.name || 'User');
      setStep('success');
    } else {
      setError(result.error || 'Transfer failed. Please try again.');
      setStep('failed');
    }
  };

  const handlePinFailed = (errMsg: string) => {
    setError(errMsg);
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

  return (
    <MobileLayout>
      <AnimatePresence mode="wait">
        {/* Input Step */}
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)]"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="font-display font-semibold text-lg">Send to Mobile Number</h1>
            </div>

            <div className="p-4 space-y-6">
              {/* User Info Banner */}
              {myPhoneNumber && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Your mobile number</p>
                      <p className="font-semibold">+91 {myPhoneNumber}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this with others to receive money
                  </p>
                </div>
              )}

              {/* Phone Number Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Recipient's Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    placeholder="10 digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    type="tel"
                    className="flex-1 text-lg"
                    maxLength={10}
                  />
                </div>
                {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {10 - phoneNumber.length} more digits needed
                  </p>
                )}
                {error && (
                  <p className="text-xs text-destructive mt-2">{error}</p>
                )}
              </div>

              <Button
                className="w-full h-12 btn-gradient"
                disabled={phoneNumber.length !== 10 || isSearching}
                onClick={handleContinueWithPhone}
              >
                {isSearching ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  `Find User +91 ${phoneNumber || '...'}`
                )}
              </Button>

              <div className="p-4 rounded-xl bg-palm-info/10 border border-palm-info/30">
                <h4 className="font-medium text-sm mb-2 text-palm-info">Real P2P Transfers</h4>
                <ul className="text-xs text-palm-info space-y-1">
                  <li>• Send money to any Palm IQ user</li>
                  <li>• Recipient must be registered with their mobile number</li>
                  <li>• Balance syncs across all devices</li>
                  <li>• Demo balance of ₹10,000 for new users</li>
                </ul>
              </div>
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
              <button onClick={() => { setStep('input'); setError(''); }} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                    {selectedContact?.name?.charAt(0) || <User className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedContact?.name}</p>
                  <p className="text-xs text-muted-foreground">+91 {selectedContact?.phone}</p>
                </div>
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
              {parseFloat(amount) > balance && (
                <p className="text-destructive text-sm mt-2">Insufficient balance</p>
              )}
            </div>

            <div className="p-4 pb-28 bg-card border-t border-border">
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
                onClick={() => {
                  setError('');
                  setStep('pin');
                }}
              >
                Proceed to Pay
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
            <h2 className="text-xl font-display font-bold mb-2">Sending Money</h2>
            <p className="text-muted-foreground">Transferring to {selectedContact?.name}...</p>
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

            <h2 className="text-2xl font-display font-bold mb-2">Money Sent!</h2>
            <p className="text-4xl font-display font-bold gradient-text mb-2">
              {formatCurrency(amount)}
            </p>
            <p className="text-muted-foreground mb-2">to {receiverName || selectedContact?.name}</p>
            <p className="text-xs text-muted-foreground mb-8">+91 {selectedContact?.phone}</p>

            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                setStep('input');
                setPhoneNumber('');
                setAmount('');
                setSelectedContact(null);
              }}>
                Send More
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
              <Button className="w-full" onClick={() => { setError(''); setStep('pin'); }}>
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

      {/* PIN Modal */}
      <PaymentPinModal
        isOpen={step === 'pin'}
        amount={parseFloat(amount) || 0}
        merchantName={selectedContact ? `Send to ${selectedContact.name}` : 'Send Money'}
        merchantIcon={<Phone className="w-8 h-8 text-primary" />}
        onSuccess={handlePinSuccess}
        onCancel={() => setStep('amount')}
        onFailed={handlePinFailed}
      />
    </MobileLayout>
  );
}
