import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Check, ArrowLeft, Info } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PalmScanner } from '@/components/ui/PalmScanner';
import { Button } from '@/components/ui/button';
import { usePalm } from '@/contexts/PalmContext';

type RegistrationState = 'intro' | 'select-hand' | 'scanning' | 'success' | 'failed';

export default function PalmRegisterPage() {
  const navigate = useNavigate();
  const { registerPalm, registrations, isHardwareConnected, checkHardwareConnection } = usePalm();

  const [state, setState] = useState<RegistrationState>('intro');
  const [selectedHand, setSelectedHand] = useState<'left' | 'right' | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check hardware connection when entering scanning state
  const handleStartRegistration = async () => {
    if (!selectedHand) return;
    
    // First check hardware connection
    const connected = await checkHardwareConnection();
    
    if (!connected) {
      setErrorMessage('Hardware not connected. Please connect the Palm IQ scanner device.');
      setState('failed');
      return;
    }
    
    setState('scanning');
    setScanStatus('scanning');
    setErrorMessage('');

    try {
      const result = await registerPalm(selectedHand);
      
      if (result.success) {
        setScanStatus('success');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setState('success');
      } else {
        setScanStatus('failed');
        setErrorMessage(result.error || 'Registration failed. Please try again.');
        setState('failed');
      }
    } catch (error) {
      setScanStatus('failed');
      setErrorMessage('An unexpected error occurred. Please try again.');
      setState('failed');
    }
  };

  return (
    <MobileLayout hideNav>
      <AnimatePresence mode="wait">
        {/* Intro */}
        {state === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            <div className="flex items-center p-4 border-b border-border">
              <button
                onClick={() => navigate('/')}
                className="p-2 -ml-2 rounded-lg hover:bg-secondary"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="ml-2 font-display font-semibold text-lg">Register Palm</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-8"
              >
                <Hand className="w-16 h-16 text-primary" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold mb-4">
                Secure Palm Registration
              </h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Register your palm vein pattern for contactless payments. 
                Your biometric data is securely stored in the hardware module.
              </p>

              <div className="w-full max-w-sm space-y-3 mb-8">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary text-left">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Hardware-based security</p>
                    <p className="text-xs text-muted-foreground">
                      Palm templates are stored in the TM-P module, not in the app.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary text-left">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Non-contact scanning</p>
                    <p className="text-xs text-muted-foreground">
                      Hold your palm 5-20cm from the scanner.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setState('select-hand')} className="w-full max-w-sm">
                Start Registration
              </Button>
            </div>
          </motion.div>
        )}

        {/* Select Hand */}
        {state === 'select-hand' && (
          <motion.div
            key="select-hand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            <div className="flex items-center p-4 border-b border-border">
              <button
                onClick={() => setState('intro')}
                className="p-2 -ml-2 rounded-lg hover:bg-secondary"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="ml-2 font-display font-semibold text-lg">Select Hand</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-muted-foreground mb-8">
                Which hand would you like to register?
              </p>

              <div className="flex gap-6 mb-8">
                <button
                  onClick={() => setSelectedHand('left')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                    selectedHand === 'left'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Hand className="w-12 h-12 -scale-x-100" />
                  <span className="font-medium">Left Hand</span>
                </button>

                <button
                  onClick={() => setSelectedHand('right')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                    selectedHand === 'right'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Hand className="w-12 h-12" />
                  <span className="font-medium">Right Hand</span>
                </button>
              </div>

              {registrations.length > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  You have {registrations.length} palm(s) registered
                </p>
              )}

              <Button
                onClick={handleStartRegistration}
                disabled={!selectedHand}
                className="w-full max-w-sm"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Scanning */}
        {state === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6"
          >
            <h2 className="text-xl font-display font-semibold mb-2">
              Registering {selectedHand} palm
            </h2>
            <p className="text-muted-foreground mb-8 text-center">
              Hold your palm steady in front of the scanner
            </p>

            <PalmScanner status={scanStatus} />

            <p className="mt-8 text-sm text-muted-foreground">
              Do not move your hand during scanning
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

            <h1 className="text-2xl font-display font-bold mb-2">Palm Registered!</h1>
            <p className="text-muted-foreground mb-8">
              Your {selectedHand} palm is now ready for payments.
            </p>

            <Button onClick={() => navigate('/')} className="w-full max-w-sm">
              Start Using Palm Pay
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
            <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
              <Hand className="w-12 h-12 text-destructive" />
            </div>

            <h1 className="text-2xl font-display font-bold mb-2">Registration Failed</h1>
            <p className="text-muted-foreground mb-8">
              {errorMessage || "We couldn't capture your palm. Please try again."}
            </p>

            <div className="flex gap-3 w-full max-w-sm">
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => { setState('select-hand'); setScanStatus('idle'); setErrorMessage(''); }} className="flex-1">
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
