import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, Fingerprint, Bell, RefreshCw } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useNavigate } from 'react-router-dom';

const securityFeatures = [
  {
    icon: Fingerprint,
    title: 'Biometric Security',
    description: 'Your palm vein pattern is unique and cannot be replicated or stolen like passwords.',
  },
  {
    icon: Database,
    title: 'Data Protection',
    description: 'Palm vein templates are stored only on external hardware, never in the app or cloud servers.',
  },
  {
    icon: Lock,
    title: 'Encrypted Transactions',
    description: 'All transaction data is encrypted end-to-end using industry-standard encryption protocols.',
  },
  {
    icon: Eye,
    title: 'Privacy First',
    description: 'We never sell or share your personal data with third parties for marketing purposes.',
  },
];

export default function PrivacySecurityPage() {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Privacy & Security</h1>
        </div>

        {/* Security Features */}
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground px-1">How We Protect You</h2>
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-border"
            >
              <div className="p-3 rounded-xl bg-primary/20">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data We Collect */}
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground px-1">Data We Collect</h2>
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Account Information</h3>
              <p className="text-sm text-muted-foreground">
                Email address, display name, and authentication credentials for account access.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Transaction Data</h3>
              <p className="text-sm text-muted-foreground">
                Payment amounts, timestamps, and merchant information for your transaction history.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Health Metrics</h3>
              <p className="text-sm text-muted-foreground">
                Body temperature readings captured during palm scans. Heart rate and SpO2 are demo features only.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Location Data</h3>
              <p className="text-sm text-muted-foreground">
                Transaction location is recorded at the time of payment for security and history purposes.
              </p>
            </div>
          </div>
        </div>

        {/* What We DON'T Collect */}
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground px-1">What We DON'T Collect</h2>
          <div className="p-4 rounded-2xl bg-palm-success/10 border border-palm-success/20">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-palm-success" />
                <span>Palm images or vein templates (stored only on hardware)</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-palm-success" />
                <span>Real banking or UPI credentials</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-palm-success" />
                <span>Background location tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-palm-success" />
                <span>Contact lists or personal files</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Your Rights */}
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground px-1">Your Rights</h2>
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">Data Access & Export</h3>
                <p className="text-sm text-muted-foreground">Request a copy of your data at any time.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">Notification Control</h3>
                <p className="text-sm text-muted-foreground">Manage which alerts and notifications you receive.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">Account Deletion</h3>
                <p className="text-sm text-muted-foreground">Request complete deletion of your account and data.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <h3 className="font-semibold mb-2">Privacy Questions?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            For privacy concerns or data requests, contact us:
          </p>
          <div className="space-y-1 text-sm">
            <p><strong>Email:</strong> palmiq24@gmail.com</p>
            <p><strong>Phone:</strong> 7338547046</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Prototype Notice:</strong> Palm IQ is a demonstration application. This privacy policy 
            outlines our data handling practices for the prototype. No real financial transactions or 
            sensitive biometric data processing occurs in this demo version.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
