import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { motion } from 'framer-motion';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function MobileLayout({ children, hideNav = false, title, showBack, onBack }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center h-14 px-4">
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="font-display font-semibold text-lg ml-2">{title}</h1>
          </div>
        </header>
      )}

      {/* Main content */}
      <motion.main
        className={`${hideNav ? '' : 'pb-24'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      {/* Bottom navigation */}
      {!hideNav && <BottomNav />}
    </div>
  );
}
