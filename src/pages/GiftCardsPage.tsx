import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, CheckCircle, Delete, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useWallet } from '@/contexts/WalletContext';
import { usePin } from '@/contexts/PinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = 'select' | 'details' | 'pin' | 'processing' | 'success' | 'failed';

const giftCards = [
  { id: 'amazon', name: 'Amazon', icon: '🛒', color: 'bg-orange-500/20' },
  { id: 'flipkart', name: 'Flipkart', icon: '🛍️', color: 'bg-blue-500/20' },
  { id: 'swiggy', name: 'Swiggy', icon: '🍔', color: 'bg-orange-400/20' },
  { id: 'zomato', name: 'Zomato', icon: '🍕', color: 'bg-red-500/20' },
  { id: 'myntra', name: 'Myntra', icon: '👗', color: 'bg-pink-500/20' },
  { id: 'bookmyshow', name: 'BookMyShow', icon: '🎬', color: 'bg-red-600/20' },
  { id: 'spotify', name: 'Spotify', icon: '🎵', color: 'bg-green-500/20' },
  { id: 'google', name: 'Google Play', icon: '▶️', color: 'bg-blue-400/20' },
];

const amounts = [100, 250, 500, 1000, 2000, 5000];

export default function GiftCardsPage() {
  const navigate = useNavigate();
  const { balance, deductBalance, addTransaction } = useWallet();
  const { verifyPin } = usePin();

  const [step, setStep] = useState<Step>('select');
  const [selectedCard, setSelectedCard] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [giftCode, setGiftCode] = useState('');

  const handlePinKeyPress = (key: string) => {
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(prev => prev + key);
    }
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) return;

    if (!verifyPin(pin)) {
      setError('Incorrect PIN. Please try again or reset via email.');
      setStep('failed');
      return;
    }

    setStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const numAmount = parseFloat(amount);
    deductBalance(numAmount);
    
    const cardName = giftCards.find(c => c.id === selectedCard)?.name || 'Gift Card';
    addTransaction({
      type: 'demo_transfer',
      amount: numAmount,
      merchant: `${cardName} Gift Card`,
      description: `Gift Card for ${recipientEmail || 'Self'}`,
      status: 'success',
    });

    // Generate demo gift code
    setGiftCode(`${selectedCard.toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
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

  const selectedCardData = giftCards.find(c => c.id === selectedCard);

  return (
    <MobileLayout>
      <AnimatePresence mode="wait">
        {/* Select Card */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)]"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="font-display font-semibold text-lg">Gift Cards</h1>
            </div>

            <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {giftCards.map((card) => (
                  <motion.button
                    key={card.id}
                    className={`p-4 rounded-2xl border text-left transition-colors ${
                      selectedCard === card.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-secondary/50'
                    }`}
                    onClick={() => setSelectedCard(card.id)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center text-2xl mb-2`}>
                      {card.icon}
                    </div>
                    <span className="font-medium">{card.name}</span>
                  </motion.button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-palm-info/10 border border-palm-info/30 text-center">
                <p className="text-xs text-palm-info">Demo Mode: Simulated gift card purchase</p>
              </div>

              <Button
                className="w-full h-14 btn-gradient"
                disabled={!selectedCard}
                onClick={() => setStep('details')}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Details Step */}
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)]"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => setStep('select')} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${selectedCardData?.color} flex items-center justify-center text-xl`}>
                  {selectedCardData?.icon}
                </div>
                <span className="font-medium">{selectedCardData?.name} Gift Card</span>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      className={`p-3 rounded-xl border text-center transition-colors ${
                        amount === amt.toString() 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:bg-secondary/50'
                      }`}
                      onClick={() => setAmount(amt.toString())}
                    >
                      <span className="font-semibold">{formatCurrency(amt)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Recipient Email (Optional)</label>
                <Input
                  type="email"
                  placeholder="recipient@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to buy for yourself</p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gift Card Value</span>
                  <span>{formatCurrency(amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(amount || 0)}</span>
                </div>
              </div>

              <Button
                className="w-full h-14 btn-gradient"
                disabled={!amount || parseFloat(amount) > balance}
                onClick={() => setStep('pin')}
              >
                Proceed to Pay {formatCurrency(amount || 0)}
              </Button>
            </div>
          </motion.div>
        )}

        {/* PIN Step */}
        {step === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="min-h-[calc(100vh-120px)] flex flex-col"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button onClick={() => { setStep('details'); setPin(''); }} className="p-2 -ml-2 rounded-full hover:bg-secondary">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="font-display font-semibold text-lg">Enter Payment PIN</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className={`w-16 h-16 rounded-full ${selectedCardData?.color} flex items-center justify-center text-3xl mb-6`}>
                {selectedCardData?.icon}
              </div>
              <p className="text-muted-foreground mb-4">{selectedCardData?.name} Gift Card</p>
              <p className="text-2xl font-display font-bold mb-8">{formatCurrency(amount)}</p>
              
              <div className="flex gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      pin.length > i ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 bg-card border-t border-border">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => (
                  <motion.button
                    key={key}
                    className={`keypad-btn ${key === 'delete' ? 'text-destructive' : ''} ${!key ? 'invisible' : ''}`}
                    onClick={() => key && handlePinKeyPress(key)}
                    whileTap={{ scale: 0.9 }}
                    disabled={!key}
                  >
                    {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
                  </motion.button>
                ))}
              </div>
              <Button
                className="w-full h-14 btn-gradient text-lg"
                disabled={pin.length !== 4}
                onClick={handleVerifyPin}
              >
                Confirm Purchase
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
            <h2 className="text-xl font-display font-bold mb-2">Processing Purchase</h2>
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
              <Gift className="w-12 h-12 text-white" />
            </motion.div>

            <h2 className="text-2xl font-display font-bold mb-2">Gift Card Purchased!</h2>
            <p className="text-4xl font-display font-bold gradient-text mb-4">
              {formatCurrency(amount)}
            </p>
            
            <div className="w-full max-w-xs p-4 rounded-xl bg-secondary/50 border border-border mb-6">
              <p className="text-xs text-muted-foreground mb-1">Gift Card Code</p>
              <p className="font-mono font-bold text-lg text-center">{giftCode}</p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                (Demo code - not redeemable)
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full" onClick={() => navigate('/')}>
                Go Home
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

            <h2 className="text-2xl font-display font-bold mb-2">Purchase Failed</h2>
            <p className="text-muted-foreground text-center mb-8">{error}</p>

            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full" onClick={() => { setPin(''); setStep('pin'); }}>
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
    </MobileLayout>
  );
}
