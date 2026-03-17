import { motion } from 'framer-motion';
import { 
  User, Hand, Shield, Bell, HelpCircle, LogOut, ChevronRight, Trash2,
  Moon, Sun, MessageCircle, Key, ArrowLeft, Phone, Copy
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePalm } from '@/contexts/PalmContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, userProfile } = useAuth();
  const { registrations, deletePalm, isRegistered } = usePalm();
  const { theme, toggleTheme } = useTheme();
  const { phoneNumber, balance } = useWallet();
  const navigate = useNavigate();

  const handleCopyPhone = () => {
    if (phoneNumber) {
      navigator.clipboard.writeText(phoneNumber);
      toast.success('Phone number copied!');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleDeletePalm = (id: string) => {
    deletePalm(id);
    toast.success('Palm removed successfully');
  };

  const menuItems = [
    { icon: Key, label: 'Change Payment PIN', to: '/change-pin' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
    { icon: HelpCircle, label: 'Help & Support', to: '/help-support' },
    { icon: Shield, label: 'Privacy & Security', to: '/privacy-security' },
  ];

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Profile</h1>
        </div>

        {/* User info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-semibold text-lg">
                {user?.displayName || 'Guest User'}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email || 'Not signed in'}</p>
            </div>
          </div>
          
          {/* Phone Number for P2P */}
          {phoneNumber && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Phone className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Your P2P Number</p>
                <p className="font-semibold">+91 {phoneNumber}</p>
              </div>
              <button 
                onClick={handleCopyPhone}
                className="p-2 rounded-lg hover:bg-primary/20 text-primary"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {!phoneNumber && user && (
            <div className="p-3 rounded-xl bg-palm-warning/10 border border-palm-warning/30">
              <p className="text-xs text-palm-warning">
                Phone number not set. Re-register to enable P2P transfers.
              </p>
            </div>
          )}
        </motion.div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-palm-warning" />
            )}
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </p>
            </div>
          </div>
          <Switch 
            checked={theme === 'light'}
            onCheckedChange={toggleTheme}
          />
        </motion.div>

        {/* Palm registrations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Registered Palms</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/palm-register')}>
              Add Palm
            </Button>
          </div>

          {registrations.length === 0 ? (
            <div className="p-6 rounded-2xl bg-secondary/50 text-center border border-border">
              <Hand className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No palms registered</p>
              <Button className="mt-4 btn-gradient" onClick={() => navigate('/palm-register')}>
                Register Palm
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {registrations.map((palm) => (
                <motion.div
                  key={palm.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className={`p-3 rounded-xl ${
                    palm.status === 'active' ? 'bg-palm-success/20' : 'bg-muted'
                  }`}>
                    <Hand className={`w-5 h-5 ${
                      palm.palmHand === 'left' ? '-scale-x-100' : ''
                    } ${palm.status === 'active' ? 'text-palm-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize">{palm.palmHand} Palm</p>
                    <p className="text-sm text-muted-foreground">
                      Registered {format(new Date(palm.registeredAt), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    palm.status === 'active' 
                      ? 'bg-palm-success/20 text-palm-success' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {palm.status}
                  </span>
                  <button
                    onClick={() => handleDeletePalm(palm.id)}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Menu items */}
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link
                to={item.to}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors text-left"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        {/* Contact & Disclaimer */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>Palm IQ Prototype v1.0.0</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            All payments are simulated. No real money involved.
          </p>
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground">
              <strong>Contact:</strong> palmiq24@gmail.com | 7338547046
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
