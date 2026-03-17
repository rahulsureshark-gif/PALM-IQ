import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Smartphone, Check, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { usePin } from '@/contexts/PinContext';
import { PaymentPinModal } from '@/components/payment/PaymentPinModal';
import { toast } from 'sonner';
import { useGoBack } from '@/hooks/useBackHandler';

type Step = 'input' | 'plans' | 'confirm' | 'pin' | 'processing' | 'success';

const operators = [
  { id: 'jio', name: 'Jio', color: 'bg-blue-500' },
  { id: 'airtel', name: 'Airtel', color: 'bg-red-500' },
  { id: 'vi', name: 'Vi', color: 'bg-yellow-500' },
  { id: 'bsnl', name: 'BSNL', color: 'bg-green-500' },
];

const plans = [
  { id: 1, amount: 199, validity: '28 days', data: '1.5GB/day', description: 'Unlimited calls + 100 SMS/day' },
  { id: 2, amount: 299, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 100 SMS/day' },
  { id: 3, amount: 449, validity: '56 days', data: '1.5GB/day', description: 'Unlimited calls + 100 SMS/day' },
  { id: 4, amount: 599, validity: '84 days', data: '1.5GB/day', description: 'Unlimited calls + 100 SMS/day' },
  { id: 5, amount: 999, validity: '84 days', data: '2.5GB/day', description: 'Unlimited calls + 100 SMS/day + Disney+ Hotstar' },
];

export default function MobileRechargePage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { balance, deductBalance, addTransaction } = useWallet();
  
  const [step, setStep] = useState<Step>('input');
  const [mobile, setMobile] = useState('');
  const [operator, setOperator] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleBack = () => {
    switch (step) {
      case 'input':
        goBack();
        break;
      case 'plans':
        setStep('input');
        break;
      case 'confirm':
        setStep('plans');
        break;
      default:
        setStep('input');
    }
  };

  const handleContinue = () => {
    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!operator) {
      toast.error('Please select an operator');
      return;
    }
    setStep('plans');
  };

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setStep('confirm');
  };

  const handleProceedToPay = () => {
    if (!selectedPlan) return;
    
    if (selectedPlan.amount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    setStep('processing');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!selectedPlan) return;
    
    const success = deductBalance(selectedPlan.amount);
    
    if (success) {
      addTransaction({
        type: 'demo_upi',
        amount: selectedPlan.amount,
        merchant: `${operators.find(o => o.id === operator)?.name} Recharge`,
        description: `Mobile Recharge - ${mobile}`,
        status: 'success',
      });
      setStep('success');
    } else {
      toast.error('Payment failed. Please try again.');
      setStep('confirm');
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Mobile Recharge</h1>
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
                  <label className="text-sm text-muted-foreground mb-2 block">Mobile Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="text-lg h-14"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">Select Operator</label>
                  <div className="grid grid-cols-4 gap-3">
                    {operators.map((op) => (
                      <button
                        key={op.id}
                        onClick={() => setOperator(op.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          operator === op.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${op.color} mx-auto mb-2`} />
                        <p className="text-xs font-medium">{op.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleContinue} className="w-full h-14 btn-gradient text-lg">
                Browse Plans
              </Button>
            </motion.div>
          )}

          {/* Plans Step */}
          {step === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-4 space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Recharging: <span className="text-foreground font-medium">{mobile}</span> ({operators.find(o => o.id === operator)?.name})
              </p>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-display font-bold">₹{plan.amount}</span>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {plan.validity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {plan.data}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && selectedPlan && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-4"
            >
              <div className="flex-1 space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground mb-1">Recharging</p>
                  <p className="text-xl font-display font-bold">{mobile}</p>
                  <p className="text-sm text-muted-foreground">{operators.find(o => o.id === operator)?.name}</p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan Amount</span>
                    <span className="font-medium">₹{selectedPlan.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validity</span>
                    <span>{selectedPlan.validity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span>{selectedPlan.data}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-display font-bold text-xl">₹{selectedPlan.amount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-palm-warning/10 border border-palm-warning/20">
                  <p className="text-sm text-palm-warning text-center">
                    Demo Mode: No real recharge will happen
                  </p>
                </div>
              </div>

              <Button onClick={handleProceedToPay} className="w-full h-14 btn-gradient text-lg mt-6">
                Pay ₹{selectedPlan.amount}
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
          {step === 'success' && selectedPlan && (
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
              <h2 className="text-2xl font-display font-bold mb-2">Recharge Successful!</h2>
              <p className="text-4xl font-display font-bold text-palm-success mb-2">₹{selectedPlan.amount}</p>
              <p className="text-muted-foreground mb-8">
                {mobile} • {operators.find(o => o.id === operator)?.name}
              </p>
              <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm mb-6">
                Demo Mode – No real recharge
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
        amount={selectedPlan?.amount || 0}
        merchantName={`${operators.find(o => o.id === operator)?.name || ''} Recharge`}
        merchantIcon={<Smartphone className="w-8 h-8 text-primary" />}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
      />
    </MobileLayout>
  );
}
