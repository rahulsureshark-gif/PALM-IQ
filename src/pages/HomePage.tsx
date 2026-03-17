import { motion } from 'framer-motion';
import { 
  Smartphone, Building, CreditCard, Gift, Receipt,
  Thermometer, Activity, Bell, ChevronRight, 
  Store, ArrowUpRight, ArrowDownLeft, Zap,
  QrCode, Send, Users, Banknote, Phone, Wifi, Car
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/contexts/HealthContext';
import { usePalm } from '@/contexts/PalmContext';
import { useWallet } from '@/contexts/WalletContext';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PalmVeinIconSimple } from '@/components/ui/PalmVeinIcon';
import { SecureBalanceCard } from '@/components/payment/SecureBalanceCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const quickActions = [
  { icon: QrCode, label: 'Scan QR', to: '/scan-qr', color: 'bg-primary' },
  { icon: Send, label: 'Send', to: '/send-money', color: 'bg-palm-info' },
  { icon: ArrowDownLeft, label: 'Request', to: '/request-money', color: 'bg-palm-success' },
  { icon: Banknote, label: 'Add Money', to: '/add-money', color: 'bg-palm-warning' },
];

const paymentServices = [
  { icon: Smartphone, label: 'Mobile Recharge', to: '/recharge' },
  { icon: Zap, label: 'Electricity', to: '/bills/electricity' },
  { icon: Wifi, label: 'DTH / Broadband', to: '/bills/dth' },
  { icon: Car, label: 'FASTag', to: '/bills/fastag' },
  { icon: CreditCard, label: 'Credit Card', to: '/bills/credit-card' },
  { icon: Receipt, label: 'All Bills', to: '/bills' },
  { icon: Gift, label: 'Gift Cards', to: '/gift-cards' },
  { icon: Store, label: 'Terminal', to: '/terminal' },
];

const moneyTransfer = [
  { icon: Users, label: 'To Contact', to: '/send-money' },
  { icon: Building, label: 'To Bank', to: '/bank-transfer' },
  { icon: Phone, label: 'To UPI ID', to: '/upi-transfer' },
  { icon: QrCode, label: 'Self Transfer', to: '/self-transfer' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { latestReading, alerts } = useHealth();
  const { isRegistered } = usePalm();
  const { balance, transactions } = useWallet();
  const navigate = useNavigate();

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const recentTransactions = transactions.slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MobileLayout>
      <motion.div
        className="space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with Logo and Profile */}
        <motion.div 
          variants={itemVariants} 
          className="bg-gradient-to-b from-primary/20 to-transparent px-4 pt-6 pb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/profile">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.displayName?.charAt(0) || 'G'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <h1 className="text-lg font-display font-bold">
                  {user?.displayName || 'Guest User'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/health" 
                className="relative p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Activity className="w-5 h-5 text-palm-health" />
                {latestReading && latestReading.temperature > 37.5 && (
                  <span className="notification-badge">!</span>
                )}
              </Link>
              <Link 
                to="/notifications" 
                className="relative p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unacknowledgedAlerts.length > 0 && (
                  <span className="notification-badge">
                    {unacknowledgedAlerts.length}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Secure Balance Card - Hidden by default, requires PIN */}
        <motion.div variants={itemVariants} className="px-4">
          <SecureBalanceCard />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="px-4">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.to} className="quick-action">
                <div className={`quick-action-icon ${action.color} text-white`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Palm Registration Banner */}
        {!isRegistered && (
          <motion.div variants={itemVariants} className="px-4">
            <Link
              to="/palm-register"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <PalmVeinIconSimple size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Register Your Palm</h3>
                <p className="text-sm text-muted-foreground">Enable biometric payments at terminals</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </motion.div>
        )}

        {/* Registered Palm Status */}
        {isRegistered && (
          <motion.div variants={itemVariants} className="px-4">
            <Link
              to="/palm-register"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-palm-success/20 to-palm-success/5 border border-palm-success/30"
            >
              <div className="p-2 rounded-xl bg-palm-success">
                <PalmVeinIconSimple size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-palm-success">Palm Registered ✓</h3>
                <p className="text-sm text-muted-foreground">Ready for terminal payments</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </motion.div>
        )}

        {/* Payment Services */}
        <motion.div variants={itemVariants} className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Recharge & Bills</h2>
            <Link to="/services" className="text-sm text-primary font-medium">See all</Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {paymentServices.map((service) => (
              <Link key={service.label} to={service.to} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <service.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="text-xs text-center text-muted-foreground line-clamp-1">{service.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Money Transfer */}
        <motion.div variants={itemVariants} className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Money Transfer</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {moneyTransfer.map((service) => (
              <Link key={service.label} to={service.to} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <service.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="text-xs text-center text-muted-foreground line-clamp-1">{service.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Health Overview */}
        <motion.div variants={itemVariants} className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Health Monitor</h2>
            <Link to="/health" className="text-sm text-primary font-medium">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-palm-health" />
                <span className="text-xs text-muted-foreground">Body Temp</span>
              </div>
              <p className="text-2xl font-display font-bold">
                {latestReading?.temperature || 36.5}°C
              </p>
              <span className="text-xs text-palm-success">Normal</span>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-palm-info" />
                <span className="text-xs text-muted-foreground">Heart Rate</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">DEMO</span>
              </div>
              <p className="text-2xl font-display font-bold">
                {latestReading?.heartRate || 72} <span className="text-sm font-normal text-muted-foreground">bpm</span>
              </p>
              <span className="text-xs text-palm-success">Healthy</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants} className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Recent Activity</h2>
            <Link to="/history" className="text-sm text-primary font-medium">View all</Link>
          </div>
          <div className="space-y-2">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((txn) => (
                <div 
                  key={txn.id} 
                  className="transaction-item cursor-pointer"
                  onClick={() => navigate('/history')}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    txn.type === 'credit' ? 'bg-palm-success/20' : 'bg-primary/20'
                  }`}>
                    {txn.type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-palm-success" />
                    ) : txn.type === 'palm_pay' ? (
                      <PalmVeinIconSimple size={20} className="text-primary" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{txn.merchant || txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.timestamp).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {txn.location && ` • ${txn.location}`}
                    </p>
                  </div>
                  <p className={`font-semibold ${txn.type === 'credit' ? 'text-palm-success' : ''}`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Merchant Terminal Link */}
        <motion.div variants={itemVariants} className="px-4 pb-4">
          <Link
            to="/terminal"
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 hover:border-primary/50 transition-colors"
          >
            <div className="p-3 rounded-xl bg-primary text-primary-foreground">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Merchant Terminal</h3>
              <p className="text-sm text-muted-foreground">Accept palm payments at your store</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </motion.div>
      </motion.div>
    </MobileLayout>
  );
}
