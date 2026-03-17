import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle, Delete } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PaymentPinModal } from '@/components/payment/PaymentPinModal';
import { useGoBack } from '@/hooks/useBackHandler';
import { toast } from 'sonner';

const recentContacts = [
  { id: '1', name: 'John Doe', phone: '+91 98765 43210', initials: 'JD' },
  { id: '2', name: 'Priya Sharma', phone: '+91 87654 32109', initials: 'PS' },
  { id: '3', name: 'Rahul Kumar', phone: '+91 76543 21098', initials: 'RK' },
  { id: '4', name: 'Anita Singh', phone: '+91 65432 10987', initials: 'AS' },
];

type Step = 'select' | 'amount' | 'processing' | 'success';

export default function SendMoneyPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { balance, deductBalance, addTransaction } = useWallet();
  
  const [step, setStep] = useState<Step>('select');
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<typeof recentContacts[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const filteredContacts = recentContacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleBack = () => {
    switch (step) {
      case 'select':
        goBack();
        break;
      case 'amount':
        setStep('select');
        setAmount('');
        break;
      default:
        setStep('select');
    }
  };

  const handleSelectContact = (contact: typeof recentContacts[0]) => {
    setSelectedContact(contact);
    setStep('amount');
  };

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.') && amount.length > 0) {
        setAmount(prev => prev + '.');
      }
    } else {
      if (amount.length < 8) {
        setAmount(prev => prev + key);
      }
    }
  };

  const handleProceedToPay = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (numAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    setStep('processing');
    
    const numAmount = parseFloat(amount);
    
    // Simulate transfer
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    deductBalance(numAmount);
    addTransaction({
      type: 'demo_transfer',
      amount: numAmount,
      merchant: selectedContact?.name,
      description: `Sent to ${selectedContact?.name}`,
      status: 'success',
    });
    
    setStep('success');
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
        {/* Select Contact */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)]"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="font-display font-semibold text-lg">Send Money</h1>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search name or phone number"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent</h3>
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <motion.button
                      key={contact.id}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
                      onClick={() => handleSelectContact(contact)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                          {contact.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-palm-info/10 border border-palm-info/30 text-center">
                <p className="text-xs text-palm-info">
                  Demo Mode: Simulated contacts - no real transfers
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enter Amount */}
        {step === 'amount' && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)] flex flex-col"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                    {selectedContact?.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedContact?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedContact?.phone}</p>
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
              <p className="text-sm text-muted-foreground">
                Balance: {formatCurrency(balance)}
              </p>
              {parseFloat(amount) > balance && (
                <p className="text-destructive text-sm mt-2">Insufficient balance</p>
              )}
            </div>

            <div className="p-4 bg-card border-t border-border">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map((key) => (
                  <motion.button
                    key={key}
                    className={`keypad-btn ${key === 'delete' ? 'text-destructive' : ''}`}
                    onClick={() => handleKeyPress(key)}
                    whileTap={{ scale: 0.9 }}
                  >
                    {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
                  </motion.button>
                ))}
              </div>
              <Button
                className="w-full h-14 btn-gradient text-lg"
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                onClick={handleProceedToPay}
              >
                Send {formatCurrency(amount || '0')}
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
            <p className="text-muted-foreground">Please wait...</p>
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
            <p className="text-muted-foreground mb-8">
              to {selectedContact?.name}
            </p>

            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Modal */}
      <PaymentPinModal
        isOpen={showPinModal}
        amount={parseFloat(amount) || 0}
        merchantName={`Send to ${selectedContact?.name}`}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
      />
    </MobileLayout>
  );
}
