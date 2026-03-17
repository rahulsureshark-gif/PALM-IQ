import { motion } from 'framer-motion';
import { Hand, Store, Shield, Fingerprint, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { usePalm } from '@/contexts/PalmContext';
import { PalmVeinIconSimple } from '@/components/ui/PalmVeinIcon';
import { useGoBack } from '@/hooks/useBackHandler';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function PalmIQPage() {
  const { registrations, isHardwareConnected } = usePalm();
  const goBack = useGoBack();

  return (
    <MobileLayout>
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-background z-10">
        <button onClick={goBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold">Palm IQ</h1>
      </div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 pb-24"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center pt-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent shadow-glow">
              <PalmVeinIconSimple size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold gradient-text">Palm IQ</h1>
          <p className="text-muted-foreground mt-1">Secure Biometric Authentication</p>
        </motion.div>

        {/* Status Card */}
        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-2xl p-5 mx-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isHardwareConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <div>
                  <p className="font-medium">Hardware Status</p>
                  <p className="text-sm text-muted-foreground">
                    {isHardwareConnected ? 'Scanner Connected' : 'Configure in Settings'}
                  </p>
                </div>
              </div>
              <Link to="/hardware-settings">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Registered Palms</p>
                    <p className="text-sm text-muted-foreground">
                      {registrations.length} palm{registrations.length !== 1 ? 's' : ''} registered
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-primary">{registrations.length}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Options */}
        <motion.div variants={itemVariants} className="space-y-4 px-1">
          <h2 className="text-lg font-semibold px-1">Features</h2>
          
          {/* Palm Registration */}
          <Link to="/palm-register">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Hand className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Palm Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Register your palm vein pattern for secure, contactless payments
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </Link>

          {/* Merchant Mode */}
          <Link to="/terminal">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20">
                <Store className="w-8 h-8 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Merchant Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Accept palm-verified payments at your business terminal
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Security Info */}
        <motion.div variants={itemVariants} className="px-1">
          <div className="bg-secondary/50 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">Bank-Grade Security</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your palm vein pattern is unique and cannot be replicated. All biometric data is encrypted and stored securely on your device.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <p className="text-sm text-muted-foreground mt-1">Accuracy Rate</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-accent">&lt;1s</div>
              <p className="text-sm text-muted-foreground mt-1">Scan Time</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </MobileLayout>
  );
}
