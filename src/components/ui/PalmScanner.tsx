import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Check, X, Thermometer } from 'lucide-react';

interface PalmScannerProps {
  status: 'idle' | 'scanning' | 'success' | 'failed';
  temperature?: number;
  onScan?: () => void;
}

export function PalmScanner({ status, temperature, onScan }: PalmScannerProps) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Outer glow rings */}
      <AnimatePresence>
        {status === 'scanning' && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-64 h-64 rounded-full border-2 border-primary/30"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute w-64 h-64 rounded-full border-2 border-primary/20"
            />
          </>
        )}
      </AnimatePresence>

      {/* Main scanner circle */}
      <motion.div
        className={`relative w-56 h-56 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ${
          status === 'idle' ? 'bg-secondary border-2 border-primary/30 hover:border-primary/60' :
          status === 'scanning' ? 'bg-secondary border-2 border-primary animate-pulse-glow' :
          status === 'success' ? 'bg-palm-success/20 border-2 border-palm-success' :
          'bg-destructive/20 border-2 border-destructive'
        }`}
        onClick={status === 'idle' ? onScan : undefined}
        whileHover={status === 'idle' ? { scale: 1.02 } : {}}
        whileTap={status === 'idle' ? { scale: 0.98 } : {}}
      >
        {/* Scan line effect */}
        {status === 'scanning' && (
          <motion.div
            className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ top: '10%' }}
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Center icon */}
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Hand className="w-16 h-16 text-primary" />
              <span className="text-sm text-muted-foreground">Tap to scan</span>
            </motion.div>
          )}
          
          {status === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Hand className="w-16 h-16 text-primary" />
              </motion.div>
              <span className="text-sm text-primary font-medium">Scanning...</span>
            </motion.div>
          )}
          
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex flex-col items-center gap-3 success-check"
            >
              <div className="w-16 h-16 rounded-full bg-palm-success flex items-center justify-center">
                <Check className="w-10 h-10 text-background" />
              </div>
              <span className="text-sm text-palm-success font-medium">Verified</span>
            </motion.div>
          )}
          
          {status === 'failed' && (
            <motion.div
              key="failed"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <X className="w-10 h-10 text-white" />
              </div>
              <span className="text-sm text-destructive font-medium">Not matched</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Temperature display */}
      <AnimatePresence>
        {temperature && (status === 'success' || status === 'failed') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary"
          >
            <Thermometer className="w-4 h-4 text-palm-health" />
            <span className="text-sm font-medium">{temperature}°C</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
