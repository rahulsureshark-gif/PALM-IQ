import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Check, Building } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { PaymentPinModal } from '@/components/payment/PaymentPinModal';
import { toast } from 'sonner';
import { useGoBack } from '@/hooks/useBackHandler';

type Step = 'input' | 'bill' | 'confirm' | 'processing' | 'success';

const providers = [
  { id: 'tata', name: 'Tata Power', region: 'Mumbai' },
  { id: 'adani', name: 'Adani Electricity', region: 'Mumbai' },
  { id: 'bses', name: 'BSES Rajdhani', region: 'Delhi' },
  { id: 'msedcl', name: 'MSEDCL', region: 'Maharashtra' },
  { id: 'bescom', name: 'BESCOM', region: 'Karnataka' },
  { id: 'tneb', name: 'TNEB', region: 'Tamil Nadu' },
];

export default function ElectricityBillPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { balance, deductBalance, addTransaction } = useWallet();
  
  const [step, setStep] = useState<Step>('input');
  const [consumerId, setConsumerId] = useState('');
  const [provider, setProvider] = useState('');
  const [billAmount] = useState(() => Math.floor(Math.random() * 2000) + 500);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleBack = () => {
    switch (step) {
      case 'input':
        goBack();
        break;
      case 'bill':
        setStep('input');
        break;
      case 'confirm':
        setStep('bill');
        break;
      default:
        setStep('input');
    }
  };

  const handleFetchBill = () => {
    if (!consumerId || consumerId.length < 8) {
      toast.error('Please enter a valid Consumer ID');
      return;
    }
    if (!provider) {
      toast.error('Please select a provider');
      return;
    }
    setStep('bill');
  };

  const handleProceedToPay = () => {
    if (billAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    setStep('processing');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = deductBalance(billAmount);
    
    if (success) {
      addTransaction({
        type: 'demo_upi',
        amount: billAmount,
        merchant: providers.find(p => p.id === provider)?.name || 'Electricity',
        description: `Electricity Bill - ${consumerId}`,
        status: 'success',
      });
      setStep('success');
    } else {
      toast.error('Payment failed. Please try again.');
      setStep('confirm');
    }
  };

  const selectedProvider = providers.find(p => p.id === provider);

  return (
    <MobileLayout>
      <div className="min-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Electricity Bill</h1>
        </div>

        <AnimatePresence mode="wait">
          {/* Input Step */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 p-4 space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">Select Provider</label>
                  <div className="space-y-2">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setProvider(p.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                          provider === p.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-palm-warning/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-palm-warning" />
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">{p.region}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Consumer ID / Account Number</label>
                  <Input
                    type="text"
                    placeholder="Enter your consumer ID"
                    value={consumerId}
                    onChange={(e) => setConsumerId(e.target.value.toUpperCase())}
                    className="text-lg h-14"
                  />
                </div>
              </div>

              <Button onClick={handleFetchBill} className="w-full h-14 btn-gradient text-lg">
                Fetch Bill
              </Button>
            </motion.div>
          )}

          {/* Bill Step */}
          {step === 'bill' && (
            <motion.div
              key="bill"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-4"
            >
              <div className="flex-1 space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-palm-warning/20 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-palm-warning" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg">{selectedProvider?.name}</p>
                      <p className="text-sm text-muted-foreground">Consumer ID: {consumerId}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Bill Period</span>
                      <span>Jan 2024 - Feb 2024</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="text-palm-warning">15 Feb 2024</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Units Consumed</span>
                      <span>{Math.floor(billAmount / 8)} kWh</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="font-semibold">Total Amount</span>
                      <span className="font-display font-bold text-2xl text-primary">₹{billAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-palm-warning/10 border border-palm-warning/20">
                  <p className="text-sm text-palm-warning text-center">
                    Demo Mode: This is simulated bill data
                  </p>
                </div>
              </div>

              <Button onClick={() => setStep('confirm')} className="w-full h-14 btn-gradient text-lg mt-6">
                Pay ₹{billAmount}
              </Button>
            </motion.div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-4"
            >
              <div className="flex-1 space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <Building className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground mb-1">Paying to</p>
                  <p className="text-xl font-display font-bold">{selectedProvider?.name}</p>
                  <p className="text-sm text-muted-foreground">Consumer ID: {consumerId}</p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Amount</span>
                    <span className="font-medium">₹{billAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Convenience Fee</span>
                    <span className="text-palm-success">FREE</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-display font-bold text-xl">₹{billAmount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-palm-warning/10 border border-palm-warning/20">
                  <p className="text-sm text-palm-warning text-center">
                    Demo Mode: No real payment will be made
                  </p>
                </div>
              </div>

              <Button onClick={handleProceedToPay} className="w-full h-14 btn-gradient text-lg mt-6">
                Confirm & Pay
              </Button>
            </motion.div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-4"
            >
              <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin mb-6" />
              <p className="text-lg font-medium">Processing Payment...</p>
              <p className="text-sm text-muted-foreground mt-2">Please wait</p>
            </motion.div>
          )}

          {/* Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-palm-success flex items-center justify-center mb-6"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold mb-2">Payment Successful!</h2>
              <p className="text-4xl font-display font-bold text-palm-success mb-2">₹{billAmount}</p>
              <p className="text-muted-foreground mb-8">
                {selectedProvider?.name} • {consumerId}
              </p>
              <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm mb-6">
                Demo Mode – No real payment
              </div>
              <Button onClick={() => navigate('/')} className="btn-gradient">
                Back to Home
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PIN Modal */}
      <PaymentPinModal
        isOpen={showPinModal}
        amount={billAmount}
        merchantName={selectedProvider?.name || 'Electricity Bill'}
        merchantIcon={<Zap className="w-8 h-8 text-palm-warning" />}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
      />
    </MobileLayout>
  );
}
