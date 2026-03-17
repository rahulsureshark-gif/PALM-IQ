import { Home, History, Heart, User, MessageCircle, Fingerprint } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { motion } from 'framer-motion';
import { PalmVeinIconSimple } from '@/components/ui/PalmVeinIcon';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/palm-iq', label: 'Palm IQ', primary: true, usePalmIcon: true },
  { to: '/assistant', icon: MessageCircle, label: 'Assistant' },
  { to: '/health', icon: Heart, label: 'Health' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                {item.primary ? (
                  <motion.div
                    className={`-mt-7 p-4 rounded-full shadow-lg ${
                      isActive 
                        ? 'bg-gradient-to-br from-primary to-accent shadow-glow' 
                        : 'bg-secondary border border-border'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.usePalmIcon ? (
                      <PalmVeinIconSimple size={24} className={isActive ? 'text-white' : 'text-foreground'} />
                    ) : item.icon && (
                      <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-foreground'}`} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.icon && <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />}
                  </motion.div>
                )}
                <span className={`text-xs font-medium ${item.primary && isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
