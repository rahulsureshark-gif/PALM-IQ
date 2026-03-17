import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, KeyRound, Check, ShieldCheck } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { usePin } from '@/contexts/PinContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Step = 'email' | 'verify' | 'newPin' | 'confirm' | 'success';

const DEMO_CODE = '123456';

export default function ForgotPinPage() {
  const navigate = useNavigate();
  const { setPaymentPin } = usePin();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(user?.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    toast.success('Demo: Use code 123456');
    setStep('verify');
    setError('');
  };

  const handleVerifyCode = () => {
    if (verificationCode === DEMO_CODE) {
      setStep('newPin');
      setError('');
    } else {
      setError('Invalid code. Use 123456 for demo.');
    }
  };

  const handleKeyPress = (key: string, target: 'newPin' | 'confirmPin') => {
    setError('');
    const setter = target === 'newPin' ? setNewPin : setConfirmPin;
    const value = target === 'newPin' ? newPin : confirmPin;
    
    if (key === 'clear') {
      setter('');
    } else if (key === 'backspace') {
      setter(prev => prev.slice(0, -1));
    } else if (value.length < 4) {
      const newValue = value + key;
      setter(newValue);
      
      if (newValue.length === 4) {
        if (target === 'newPin') {
          setStep('confirm');
        } else {
          if (newValue === newPin) {
            setPaymentPin(newValue);
            setStep('success');
            toast.success('PIN reset successfully');
          } else {
            setError('PINs do not match');
            setTimeout(() => {
              setConfirmPin('');
              setNewPin('');
              setStep('newPin');
              setError('');
            }, 1500);
          }
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 'email') {
      navigate(-1);
    } else if (step === 'verify') {
      setStep('email');
      setVerificationCode('');
    } else if (step === 'newPin') {
      setStep('verify');
      setNewPin('');
    } else if (step === 'confirm') {
      setStep('newPin');
      setConfirmPin('');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Reset Payment PIN';
      case 'verify': return 'Enter Verification Code';
      case 'newPin': return 'Enter New PIN';
      case 'confirm': return 'Confirm New PIN';
      case 'success': return 'PIN Reset!';
    }
  };

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
          <h1 className="text-2xl font-display font-bold mb-2">PIN Reset Successfully</h1>
          <p className="text-muted-foreground mb-8">Your new payment PIN is now active</p>
          <Button onClick={() => navigate('/profile')} className="btn-gradient w-full max-w-xs">
            Back to Profile
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex-1 flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">{getStepTitle()}</h1>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-center mb-6 max-w-xs">
                We'll send a verification code to your email to reset your PIN
              </p>
              
              <div className="w-full max-w-xs space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-center"
                />
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                
                <div className="p-3 rounded-xl bg-palm-warning/10 border border-palm-warning/30">
                  <p className="text-xs text-palm-warning text-center">
                    <strong>Demo Mode:</strong> Use code <strong>123456</strong> after clicking send
                  </p>
                </div>
                
                <Button 
                  onClick={handleSendCode} 
                  className="btn-gradient w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-center mb-2">
                Enter the 6-digit code sent to
              </p>
              <p className="font-semibold mb-6">{email}</p>
              
              <div className="w-full max-w-xs space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                
                <Button 
                  onClick={handleVerifyCode} 
                  className="btn-gradient w-full"
                  disabled={verificationCode.length !== 6}
                >
                  Verify Code
                </Button>
                
                <button 
                  onClick={handleSendCode}
                  className="text-sm text-primary hover:underline w-full text-center"
                >
                  Resend Code
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* New PIN Step */}
        {(step === 'newPin' || step === 'confirm') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <KeyRound className="w-16 h-16 text-primary mb-6" />
            <p className="text-lg mb-6 text-muted-foreground">
              {step === 'newPin' ? 'Enter New PIN' : 'Confirm New PIN'}
            </p>
            
            <div className="flex gap-4 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    (step === 'newPin' ? newPin : confirmPin).length > i 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-destructive text-sm mb-4">{error}</p>
            )}

            {/* Progress indicator */}
            <div className="flex gap-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-palm-success" />
              <div className="w-2 h-2 rounded-full bg-palm-success" />
              <div className={`w-2 h-2 rounded-full ${step === 'newPin' ? 'bg-primary' : 'bg-palm-success'}`} />
              <div className={`w-2 h-2 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key, step === 'newPin' ? 'newPin' : 'confirmPin')}
                  className="keypad-btn"
                >
                  {key === 'backspace' ? '⌫' : key === 'clear' ? 'C' : key}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
