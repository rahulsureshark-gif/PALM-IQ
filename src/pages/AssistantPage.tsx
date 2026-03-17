import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Heart, CreditCard, Shield, AlertTriangle, BookOpen, Sparkles, Zap, Activity, HelpCircle, Hand, CheckCircle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/contexts/HealthContext';
import { usePalm } from '@/contexts/PalmContext';
import { useGoBack } from '@/hooks/useBackHandler';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: 'health', icon: Heart, label: 'Health Info', color: 'bg-palm-health/20 text-palm-health', description: 'Your health metrics' },
  { id: 'payment', icon: CreditCard, label: 'Payments', color: 'bg-primary/20 text-primary', description: 'How to pay' },
  { id: 'security', icon: Shield, label: 'Security', color: 'bg-palm-warning/20 text-palm-warning', description: 'Stay safe' },
  { id: 'rbi', icon: BookOpen, label: 'RBI Rules', color: 'bg-palm-info/20 text-palm-info', description: 'Guidelines' },
];

const KNOWLEDGE_BASE: Record<string, string[]> = {
  greeting: [
    "Hello! I'm Palm IQ Assistant. How can I help you today?",
    "You can ask me about health parameters, payment methods, security tips, or RBI guidelines.",
  ],
  health: [
    "📊 **Health Monitoring in Palm IQ**\n\nYour palm scans capture vital health metrics:\n\n" +
    "🌡️ **Body Temperature**\n- Normal Range: 36.1°C - 37.2°C\n- Elevated (Fever): Above 37.5°C\n- High Fever: Above 38.5°C\n\n" +
    "If your temperature is elevated:\n1. Rest and stay hydrated\n2. Monitor symptoms for 24-48 hours\n3. Consult a doctor if fever persists or exceeds 39°C\n\n" +
    "❤️ **Heart Rate** (Demo)\n- Normal: 60-100 bpm\n- Elevated may indicate stress or physical activity\n\n" +
    "🫁 **SpO2 Oxygen Saturation** (Demo)\n- Normal: 95-100%\n- Below 94% may need medical attention\n\n" +
    "⚠️ **DISCLAIMER**: This app provides general health information only. It is NOT a medical device and should NOT replace professional medical advice. Always consult qualified healthcare providers for medical concerns.",
  ],
  temperature_high: [
    "🌡️ **Elevated Temperature Detected**\n\n" +
    "If your reading shows temperature above 37.5°C:\n\n" +
    "**Immediate Steps:**\n" +
    "1. Rest in a cool, comfortable environment\n" +
    "2. Stay hydrated - drink water and fluids\n" +
    "3. Take a lukewarm (not cold) shower\n" +
    "4. Wear light, breathable clothing\n\n" +
    "**Seek Medical Attention If:**\n" +
    "- Temperature exceeds 39°C (102.2°F)\n" +
    "- Fever lasts more than 3 days\n" +
    "- You experience difficulty breathing\n" +
    "- Severe headache or confusion\n" +
    "- Chest pain or persistent vomiting\n\n" +
    "⚠️ **IMPORTANT**: This is for informational purposes only. Please consult a healthcare professional for proper diagnosis and treatment.",
  ],
  payment: [
    "💳 **How Palm IQ Payments Work**\n\n" +
    "**At Merchant Terminals:**\n" +
    "1. Merchant enters payment amount on their terminal\n" +
    "2. Place your registered palm on the scanner\n" +
    "3. System verifies your palm vein pattern\n" +
    "4. Payment is processed automatically\n" +
    "5. You receive a notification with transaction details\n\n" +
    "**P2P Transfers:**\n" +
    "1. Go to Send Money from home screen\n" +
    "2. Enter recipient's mobile number\n" +
    "3. Enter amount and verify with PIN\n" +
    "4. Money transfers instantly!\n\n" +
    "**To Add Money:**\n" +
    "Go to 'Add Money' from home screen and select amount.",
  ],
  security: [
    "🛡️ **Security & Scam Prevention**\n\n" +
    "**Common UPI/Digital Payment Scams:**\n\n" +
    "❌ **Fake Payment Screenshots**\n" +
    "Scammers show fake payment confirmation images. Always verify in your transaction history.\n\n" +
    "❌ **QR Code Fraud**\n" +
    "Never scan QR codes to 'receive' money. QR codes are only for payments.\n\n" +
    "❌ **Remote Access Scams**\n" +
    "Never install screen sharing apps or share OTPs over phone calls.\n\n" +
    "**Palm Vein Security:**\n" +
    "✅ Your palm vein pattern is unique and cannot be replicated\n" +
    "✅ Palm data stays on external hardware, never in the app\n" +
    "✅ Each scan is verified in real-time\n\n" +
    "**Stay Safe:**\n" +
    "• Never share your payment PIN\n" +
    "• Enable transaction notifications\n" +
    "• Report suspicious activity immediately",
  ],
  rbi: [
    "📖 **RBI Guidelines for Digital Payments**\n\n" +
    "**Key Regulations (As per RBI):**\n\n" +
    "1️⃣ **Zero Liability Protection**\n" +
    "You're protected from unauthorized transactions if reported within 3 days.\n\n" +
    "2️⃣ **Two-Factor Authentication**\n" +
    "All digital payments require additional verification.\n\n" +
    "3️⃣ **Transaction Limits**\n" +
    "Daily UPI limit: ₹1 lakh (varies by bank)\n\n" +
    "4️⃣ **Dispute Resolution**\n" +
    "- File complaint within 30 days\n" +
    "- Bank must respond within 90 days\n\n" +
    "**Reporting Fraud:**\n" +
    "• Call your bank immediately\n" +
    "• Report to cybercrime.gov.in\n" +
    "• RBI Helpline: 1800-225-3344",
  ],
  default: [
    "I can help you with:\n\n" +
    "🏥 **Health** - Understanding your health metrics\n" +
    "💳 **Payments** - How to use palm payments\n" +
    "🛡️ **Security** - Staying safe from scams\n" +
    "📖 **RBI Rules** - Payment regulations\n\n" +
    "What would you like to know about?",
  ],
};

function getResponse(input: string): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('health') || lowerInput.includes('temperature') || 
      lowerInput.includes('heart') || lowerInput.includes('spo2') || lowerInput.includes('fever')) {
    if (lowerInput.includes('high') || lowerInput.includes('fever') || lowerInput.includes('elevated')) {
      return KNOWLEDGE_BASE.temperature_high[0];
    }
    return KNOWLEDGE_BASE.health[0];
  }
  
  if (lowerInput.includes('pay') || lowerInput.includes('money') || 
      lowerInput.includes('transaction') || lowerInput.includes('terminal') || lowerInput.includes('transfer')) {
    return KNOWLEDGE_BASE.payment[0];
  }
  
  if (lowerInput.includes('scam') || lowerInput.includes('fraud') || 
      lowerInput.includes('security') || lowerInput.includes('safe')) {
    return KNOWLEDGE_BASE.security[0];
  }
  
  if (lowerInput.includes('rbi') || lowerInput.includes('rule') || 
      lowerInput.includes('regulation') || lowerInput.includes('guideline')) {
    return KNOWLEDGE_BASE.rbi[0];
  }
  
  if (lowerInput.includes('hi') || lowerInput.includes('hello') || lowerInput.includes('hey')) {
    return KNOWLEDGE_BASE.greeting.join('\n\n');
  }
  
  return KNOWLEDGE_BASE.default[0];
}

export default function AssistantPage() {
  const { user } = useAuth();
  const { readings } = useHealth();
  const { isRegistered, registrations, registerPalm, isHardwareConnected, checkHardwareConnection } = usePalm();
  const goBack = useGoBack();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedHand, setSelectedHand] = useState<'left' | 'right' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const latestReading = readings[readings.length - 1];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startChat = (topicId?: string) => {
    setShowChat(true);
    
    let initialMessage = `Hello ${user?.displayName || 'there'}! I'm your Palm IQ Assistant. How can I help you today?`;
    
    if (topicId && KNOWLEDGE_BASE[topicId]) {
      initialMessage = KNOWLEDGE_BASE[topicId][0];
    }
    
    setMessages([{
      id: '1',
      type: 'bot',
      content: initialMessage,
      timestamp: new Date(),
    }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const botResponse: Message = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: getResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const handlePalmRegister = async (hand: 'left' | 'right') => {
    // First check hardware connection
    const connected = await checkHardwareConnection();
    
    if (!connected) {
      // Show error in chat
      setShowChat(true);
      setMessages([{
        id: '1',
        type: 'bot',
        content: `⚠️ **Hardware Not Connected**\n\nPlease connect the Palm IQ scanner device to register your palm.\n\nMake sure the device is:\n- Powered on\n- Connected via USB/Bluetooth\n- Properly configured`,
        timestamp: new Date(),
      }]);
      return;
    }
    
    setIsRegistering(true);
    setSelectedHand(hand);
    
    const result = await registerPalm(hand);
    
    setIsRegistering(false);
    setSelectedHand(null);
    
    if (result.success) {
      // Start chat with success message
      setShowChat(true);
      setMessages([{
        id: '1',
        type: 'bot',
        content: `🎉 **Palm Registered Successfully!**\n\nYour ${hand} palm has been registered and is now active. You can now:\n\n✅ Make contactless payments at terminals\n✅ Get health readings with each scan\n✅ Enjoy secure biometric authentication\n\nHow else can I help you today?`,
        timestamp: new Date(),
      }]);
    } else {
      // Show error in chat
      setShowChat(true);
      setMessages([{
        id: '1',
        type: 'bot',
        content: `❌ **Registration Failed**\n\n${result.error || "We couldn't capture your palm. Please try again."}\n\nMake sure to:\n- Hold your palm steady\n- Keep 5-20cm distance from scanner\n- Ensure proper lighting`,
        timestamp: new Date(),
      }]);
    }
  };

  if (showChat) {
    return (
      <MobileLayout hideNav>
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
            <button onClick={() => setShowChat(false)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold">Palm IQ Assistant</h1>
              <p className="text-xs text-muted-foreground">Ask me anything</p>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === 'user' ? 'bg-primary' : 'bg-gradient-to-br from-primary to-accent'
                    }`}>
                      {msg.type === 'user' ? (
                        <User className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div className={`p-3 rounded-2xl ${
                      msg.type === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-md' 
                        : 'bg-secondary rounded-tl-md'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      <p className={`text-xs mt-1 ${
                        msg.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 bg-palm-warning/10 border-t border-palm-warning/20">
            <p className="text-xs text-palm-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Health info is suggestive only. Consult a doctor for medical advice.
            </p>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about health, payments, security..."
                className="flex-1 px-4 py-3 rounded-xl bg-secondary border-none outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={handleSend} className="btn-gradient px-4">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }


  return (
    <MobileLayout>
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-background z-10">
        <button onClick={goBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-display font-bold">Palm IQ Assistant</h1>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Quick Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Palm IQ Assistant</h1>
          <p className="text-muted-foreground mt-1">Your personal health & payment guide</p>
        </motion.div>

        {/* Health Summary Card */}
        {latestReading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-palm-health/20 to-palm-health/5 border border-palm-health/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-palm-health" />
              <h3 className="font-semibold">Latest Health Check</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-xl bg-card/50">
                <p className="text-lg font-bold">{latestReading.temperature?.toFixed(1)}°C</p>
                <p className="text-xs text-muted-foreground">Temp</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-card/50">
                <p className="text-lg font-bold">{latestReading.heartRate || '--'}</p>
                <p className="text-xs text-muted-foreground">BPM</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-card/50">
                <p className="text-lg font-bold">{latestReading.spo2 || '--'}%</p>
                <p className="text-xs text-muted-foreground">SpO2</p>
              </div>
            </div>
            <button 
              onClick={() => startChat('health')}
              className="w-full mt-3 py-2 text-sm text-palm-health hover:bg-palm-health/10 rounded-xl transition-colors"
            >
              Ask about your health →
            </button>
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => startChat(action.id)}
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">{action.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Palm Registration Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`p-4 rounded-2xl border ${
            isRegistered 
              ? 'bg-palm-success/10 border-palm-success/30' 
              : 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isRegistered ? 'bg-palm-success/20' : 'bg-primary/20'
            }`}>
              {isRegistered ? (
                <CheckCircle className="w-5 h-5 text-palm-success" />
              ) : (
                <Hand className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {isRegistered ? 'Palm Registered' : 'Register Your Palm'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRegistered 
                  ? `${registrations.filter(r => r.status === 'active').length} palm(s) active` 
                  : 'Enable contactless payments'}
              </p>
            </div>
          </div>
          
          {!isRegistered && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Register your palm to make payments at merchant terminals and get health readings.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handlePalmRegister('left')}
                  disabled={isRegistering}
                  className="flex items-center gap-2"
                >
                  <Hand className="w-4 h-4 -scale-x-100" />
                  {isRegistering && selectedHand === 'left' ? 'Scanning...' : 'Left Palm'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePalmRegister('right')}
                  disabled={isRegistering}
                  className="flex items-center gap-2"
                >
                  <Hand className="w-4 h-4" />
                  {isRegistering && selectedHand === 'right' ? 'Scanning...' : 'Right Palm'}
                </Button>
              </div>
              {isRegistering && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <p className="text-sm text-primary">Place your {selectedHand} palm on the scanner...</p>
                </div>
              )}
            </div>
          )}
          
          {isRegistered && (
            <div className="flex flex-wrap gap-2">
              {registrations.filter(r => r.status === 'active').map((reg) => (
                <span 
                  key={reg.id}
                  className="px-3 py-1 rounded-full bg-palm-success/20 text-palm-success text-xs font-medium capitalize"
                >
                  {reg.palmHand} Palm ✓
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Start Chat Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={() => startChat()}
            className="w-full btn-gradient py-6 text-lg"
          >
            <Bot className="w-5 h-5 mr-2" />
            Start Conversation
          </Button>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <h3 className="font-display font-semibold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked
          </h3>
          
          {[
            'How do palm payments work?',
            'What if my temperature is high?',
            'How to report a scam?',
            'How to transfer money?',
          ].map((question, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(question);
                startChat();
                setTimeout(() => {
                  setMessages(prev => [...prev, {
                    id: `user_${Date.now()}`,
                    type: 'user',
                    content: question,
                    timestamp: new Date(),
                  }]);
                  setTimeout(() => {
                    setMessages(prev => [...prev, {
                      id: `bot_${Date.now()}`,
                      type: 'bot',
                      content: getResponse(question),
                      timestamp: new Date(),
                    }]);
                  }, 500);
                }, 100);
              }}
              className="w-full p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-left text-sm flex items-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4 text-primary" />
              {question}
            </button>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            This assistant provides general information only. For medical emergencies, contact a doctor immediately.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
