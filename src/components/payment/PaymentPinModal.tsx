import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Delete, Lock, AlertCircle } from 'lucide-react';
import { usePin } from '@/contexts/PinContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useBackHandler } from '@/hooks/useBackHandler';

interface PaymentPinModalProps {
  isOpen: boolean;
  amount: number;
  merchantName: string;
  merchantIcon?: React.ReactNode;
  onSuccess: () => void;
  onCancel: () => void;
  onFailed?: (error: string) => void;
}

export function PaymentPinModal({
  isOpen,
  amount,
  merchantName,
  merchantIcon,
  onSuccess,
  onCancel,
  onFailed,
}: PaymentPinModalProps) {
  const navigate = useNavigate();
  const { verifyPin } = usePin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // When the PIN screen is open, Android back/gesture should close it (not navigate away).
  useBackHandler(
    () => {
      if (!isOpen) return;
      onCancel();
      return true;
    },
    isOpen,
  );

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setAttempts(0);
      setIsVerifying(false);
    }
  }, [isOpen]);

  const handleKeyPress = (key: string) => {
    if (isVerifying) return;
    
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
      setError('');
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      setError('');

      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => handleVerifyPin(newPin), 200);
      }
    }
  };

  const handleVerifyPin = (pinToVerify: string) => {
    setIsVerifying(true);
    
    if (verifyPin(pinToVerify)) {
      setError('');
      setIsVerifying(false);
      onSuccess();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPin('');
      setIsVerifying(false);
      
      if (nextAttempts >= 3) {
        setError('Too many attempts. Please reset your PIN.');
        if (onFailed) {
          onFailed('Too many incorrect PIN attempts');
        }
      } else {
        setError(`Incorrect PIN. ${3 - nextAttempts} attempts remaining.`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
          <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-semibold text-lg">Enter Payment PIN</h1>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center p-6 min-h-full">
            {/* Merchant Info */}
            <div className="text-center mb-6">
              {merchantIcon ? (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  {merchantIcon}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
              )}
              <p className="text-muted-foreground mb-2">{merchantName}</p>
              {amount > 0 && (
                <p className="text-3xl font-display font-bold">{formatCurrency(amount)}</p>
              )}
            </div>

            {/* PIN Dots */}
            <div className="flex gap-4 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    pin.length > i 
                      ? 'bg-primary border-primary' 
                      : error 
                        ? 'border-destructive' 
                        : 'border-muted-foreground'
                  }`}
                  animate={error && pin.length === 0 ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive text-sm mb-4"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {attempts >= 3 && (
              <Button
                variant="link"
                className="text-primary"
                onClick={() => navigate('/forgot-pin')}
              >
                Reset PIN via Email
              </Button>
            )}
          </div>
        </div>

        {/* Fixed Keypad at Bottom - Always Visible */}
        <div className="shrink-0 p-4 bg-card border-t border-border safe-bottom">
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => (
              <motion.button
                key={key}
                className={`h-14 rounded-2xl text-xl font-semibold flex items-center justify-center transition-colors ${
                  key === 'delete' 
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                    : key 
                      ? 'bg-secondary hover:bg-secondary/80 text-foreground' 
                      : ''
                } ${!key ? 'invisible' : ''}`}
                onClick={() => key && handleKeyPress(key)}
                whileTap={{ scale: 0.9 }}
                disabled={!key || attempts >= 3 || isVerifying}
              >
                {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Default PIN: 1234
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}