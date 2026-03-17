import { motion } from 'framer-motion';
import { ArrowLeft, Smartphone, Zap, Wifi, Car, CreditCard, Droplets, Home, Phone, Tv, Shield, Building } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';

const billCategories = [
  { icon: Smartphone, label: 'Mobile Recharge', to: '/recharge', color: 'bg-blue-500/20 text-blue-500' },
  { icon: Zap, label: 'Electricity', to: '/bills/electricity', color: 'bg-yellow-500/20 text-yellow-500' },
  { icon: Wifi, label: 'DTH / Broadband', to: '/bills/dth', color: 'bg-purple-500/20 text-purple-500' },
  { icon: Car, label: 'FASTag', to: '/bills/fastag', color: 'bg-green-500/20 text-green-500' },
  { icon: CreditCard, label: 'Credit Card', to: '/bills/credit-card', color: 'bg-red-500/20 text-red-500' },
  { icon: Droplets, label: 'Water Bill', to: '/bills/water', color: 'bg-cyan-500/20 text-cyan-500' },
  { icon: Home, label: 'Rent Payment', to: '/bills/rent', color: 'bg-orange-500/20 text-orange-500' },
  { icon: Phone, label: 'Landline', to: '/bills/landline', color: 'bg-teal-500/20 text-teal-500' },
  { icon: Tv, label: 'Cable TV', to: '/bills/cable', color: 'bg-pink-500/20 text-pink-500' },
  { icon: Shield, label: 'Insurance', to: '/bills/insurance', color: 'bg-indigo-500/20 text-indigo-500' },
  { icon: Building, label: 'Municipal Tax', to: '/bills/tax', color: 'bg-amber-500/20 text-amber-500' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function AllBillsPage() {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="min-h-[calc(100vh-120px)]">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-semibold text-lg">All Bills & Recharges</h1>
        </div>

        <motion.div
          className="p-4 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {billCategories.map((item) => (
            <motion.div key={item.label} variants={itemVariants}>
              <Link
                to={item.to}
                className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="font-medium flex-1">{item.label}</span>
                <ArrowLeft className="w-5 h-5 rotate-180 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}

          <div className="p-3 rounded-xl bg-palm-info/10 border border-palm-info/30 text-center mt-6">
            <p className="text-xs text-palm-info">Demo Mode: All bill payments are simulated</p>
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
