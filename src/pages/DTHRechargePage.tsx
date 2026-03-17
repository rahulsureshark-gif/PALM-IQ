import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Tv, Check, Wifi } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { PaymentPinModal } from '@/components/payment/PaymentPinModal';
import { toast } from 'sonner';
import { useGoBack } from '@/hooks/useBackHandler';

type Step = 'input' | 'plans' | 'confirm' | 'processing' | 'success';

const operators = [
  { id: 'tataplay', name: 'Tata Play', color: 'bg-purple-500' },
  { id: 'airtel', name: 'Airtel Digital TV', color: 'bg-red-500' },
  { id: 'dish', name: 'Dish TV', color: 'bg-orange-500' },
  { id: 'sun', name: 'Sun Direct', color: 'bg-yellow-500' },
  { id: 'd2h', name: 'Videocon D2H', color: 'bg-blue-500' },
];

const plans = [
  { id: 1, amount: 153, name: 'Hindi Lite', channels: '140+ Channels', validity: '1 Month' },
  { id: 2, amount: 253, name: 'Hindi Smart', channels: '220+ Channels', validity: '1 Month' },
  { id: 3, amount: 353, name: 'Hindi Premium', channels: '300+ Channels', validity: '1 Month' },
  { id: 4, amount: 499, name: 'All India Pack', channels: '400+ Channels', validity: '1 Month' },
  { id: 5, amount: 999, name: 'Super Premium', channels: '500+ Channels + OTT', validity: '1 Month' },
];

export default function DTHRechargePage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { balance, deductBalance, addTransaction } = useWallet();
  
  const [step, setStep] = useState<Step>('input');
  const [subscriberId, setSubscriberId] = useState('');
  const [operator, setOperator] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [customAmount, setCustomAmount] = useState('');
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
    if (!subscriberId || subscriberId.length < 8) {
      toast.error('Please enter a valid Subscriber ID');
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
    setCustomAmount('');
    setStep('confirm');
  };

  const handleCustomRecharge = () => {
    const amount = parseInt(customAmount);
    if (!amount || amount < 50) {
      toast.error('Minimum recharge amount is ₹50');
      return;
    }
    setSelectedPlan({ id: 0, amount, name: 'Custom Recharge', channels: 'Based on your pack', validity: 'Varies' });
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
        merchant: operators.find(o => o.id === operator)?.name || 'DTH',
        description: `DTH Recharge - ${subscriberId}`,
        status: 'success',
      });
      setStep('success');
    } else {
      toast.error('Payment failed. Please try again.');
      setStep('confirm');
    }
  };

  const selectedOperator = operators.find(o => o.id === operator);

  return (
    <MobileLayout>
      <div className="min-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">DTH / Broadband</h1>
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
                  <label className="text-sm text-muted-foreground mb-3 block">Select Operator</label>
                  <div className="grid grid-cols-3 gap-3">
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
                        <div className={`w-10 h-10 rounded-full ${op.color} mx-auto mb-2 flex items-center justify-center`}>
                          <Tv className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-medium text-center">{op.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Subscriber ID / Customer ID</label>
                  <Input
                    type="text"
                    placeholder="Enter subscriber ID"
                    value={subscriberId}
                    onChange={(e) => setSubscriberId(e.target.value.toUpperCase())}
                    className="text-lg h-14"
                  />
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
                Recharging: <span className="text-foreground font-medium">{subscriberId}</span> ({selectedOperator?.name})
              </p>

              {/* Custom Amount */}
              <div className="p-4 rounded-2xl bg-card border border-border">
                <p className="text-sm text-muted-foreground mb-3">Enter Custom Amount</p>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="₹ Amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCustomRecharge} variant="outline">
                    Recharge
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground pt-2">Or select a pack</p>

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
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Wifi className="w-4 h-4" />
                      {plan.channels}
                    </p>
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
                  <Tv className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground mb-1">Recharging</p>
                  <p className="text-xl font-display font-bold">{subscriberId}</p>
                  <p className="text-sm text-muted-foreground">{selectedOperator?.name}</p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pack</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Channels</span>
                    <span>{selectedPlan.channels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validity</span>
                    <span>{selectedPlan.validity}</span>
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
              <p className="text-lg font-medium">Processing Recharge...</p>
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
                {selectedOperator?.name} • {subscriberId}
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
        merchantName={selectedOperator?.name || 'DTH Recharge'}
        merchantIcon={<Tv className="w-8 h-8 text-primary" />}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
      />
    </MobileLayout>
  );
}
