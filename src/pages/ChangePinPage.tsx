import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Check, Eye, EyeOff } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePin } from '@/contexts/PinContext';
import { toast } from 'sonner';

type Step = 'current' | 'new' | 'confirm' | 'success';

export default function ChangePinPage() {
  const navigate = useNavigate();
  const { verifyPin, setPaymentPin } = usePin();
  
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleKeyPress = (key: string) => {
    setError('');
    
    if (step === 'current') {
      if (key === 'clear') {
        setCurrentPin('');
      } else if (key === 'backspace') {
        setCurrentPin((prev) => prev.slice(0, -1));
      } else if (currentPin.length < 6) {
        const newValue = currentPin + key;
        setCurrentPin(newValue);
        
        if (newValue.length === 4) {
          if (verifyPin(newValue)) {
            setStep('new');
            setCurrentPin('');
          } else {
            setError('Incorrect PIN');
            setTimeout(() => {
              setCurrentPin('');
              setError('');
            }, 1500);
          }
        }
      }
    } else if (step === 'new') {
      if (key === 'clear') {
        setNewPin('');
      } else if (key === 'backspace') {
        setNewPin((prev) => prev.slice(0, -1));
      } else if (newPin.length < 6) {
        const newValue = newPin + key;
        setNewPin(newValue);
        
        if (newValue.length === 4) {
          setStep('confirm');
        }
      }
    } else if (step === 'confirm') {
      if (key === 'clear') {
        setConfirmPin('');
      } else if (key === 'backspace') {
        setConfirmPin((prev) => prev.slice(0, -1));
      } else if (confirmPin.length < 6) {
        const newValue = confirmPin + key;
        setConfirmPin(newValue);
        
        if (newValue.length === 4) {
          if (newValue === newPin) {
            setPaymentPin(newValue);
            setStep('success');
            toast.success('PIN changed successfully');
          } else {
            setError('PINs do not match');
            setTimeout(() => {
              setConfirmPin('');
              setNewPin('');
              setStep('new');
              setError('');
            }, 1500);
          }
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 'current') {
      navigate(-1);
    } else if (step === 'new') {
      setStep('current');
      setNewPin('');
    } else if (step === 'confirm') {
      setStep('new');
      setConfirmPin('');
    }
  };

  const getCurrentValue = () => {
    switch (step) {
      case 'current': return currentPin;
      case 'new': return newPin;
      case 'confirm': return confirmPin;
      default: return '';
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'current': return 'Enter Current PIN';
      case 'new': return 'Enter New PIN';
      case 'confirm': return 'Confirm New PIN';
      case 'success': return 'PIN Changed!';
    }
  };

  const pinValue = getCurrentValue();

  if (step === 'success') {
    return (
      <MobileLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-palm-success flex items-center justify-center mb-6"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold mb-2">PIN Changed Successfully</h1>
          <p className="text-muted-foreground mb-8">Your payment PIN has been updated</p>
          <Button onClick={() => navigate('/profile')} className="btn-gradient w-full max-w-xs">
            Back to Profile
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Change Payment PIN</h1>
        </div>

        {/* PIN Entry */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Lock className="w-16 h-16 text-primary mb-6" />
          <p className="text-lg mb-6 text-muted-foreground">{getStepTitle()}</p>
          
          <div className="flex gap-4 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  pinValue.length > i ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-destructive text-sm mb-4">{error}</p>
          )}

          {/* Progress indicator */}
          <div className="flex gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${step === 'current' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'new' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {/* Forgot PIN link */}
          {step === 'current' && (
            <button
              onClick={() => navigate('/forgot-pin')}
              className="text-sm text-primary hover:underline mb-4"
            >
              Forgot PIN?
            </button>
          )}

          {/* Keypad */}
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
      </div>
    </MobileLayout>
  );
}
