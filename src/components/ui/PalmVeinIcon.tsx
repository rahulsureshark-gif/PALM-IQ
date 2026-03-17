import { motion } from 'framer-motion';

interface PalmVeinIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function PalmVeinIcon({ size = 24, className = '', animate = false }: PalmVeinIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={animate ? { scale: [1, 1.05, 1] } : {}}
      transition={animate ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {/* Palm outline with glow effect */}
      <defs>
        <linearGradient id="palmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(200, 100%, 60%)" />
          <stop offset="50%" stopColor="hsl(180, 100%, 50%)" />
          <stop offset="100%" stopColor="hsl(200, 100%, 70%)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Hand silhouette */}
      <path
        d="M50 10
           C45 10 42 15 42 22 L42 35
           C38 33 33 32 30 35 C27 38 28 43 30 47
           L25 40 C22 37 18 37 16 40 C14 43 15 48 18 52
           L15 47 C12 44 8 45 6 48 C4 51 5 56 8 60
           L50 95
           L92 60 C95 56 96 51 94 48 C92 45 88 44 85 47
           L82 52 C85 48 86 43 84 40 C82 37 78 37 75 40
           L70 47 C72 43 73 38 70 35 C67 32 62 33 58 35
           L58 22 C58 15 55 10 50 10"
        fill="url(#palmGradient)"
        opacity="0.3"
        filter="url(#glow)"
      />
      
      {/* Vein pattern - main trunk */}
      <motion.path
        d="M50 90 L50 45 M50 45 L35 25 M50 45 L65 25"
        stroke="url(#palmGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      
      {/* Vein pattern - branches */}
      <motion.path
        d="M50 65 L30 55 M50 65 L70 55 M50 55 L35 40 M50 55 L65 40"
        stroke="url(#palmGradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
      />
      
      {/* Vein pattern - fine details */}
      <motion.path
        d="M35 55 L25 50 M65 55 L75 50 M35 40 L28 35 M65 40 L72 35"
        stroke="url(#palmGradient)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}

// Simple static version for small icons
export function PalmVeinIconSimple({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="palmGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" />
        </linearGradient>
      </defs>
      {/* Simplified palm with veins */}
      <path
        d="M12 2C10.5 2 9.5 3 9.5 4.5V8C8.5 7.5 7 7.5 6 8.5C5 9.5 5.5 11 6.5 12L4 9.5C3 8.5 1.5 8.5 1 10C0.5 11 1 12.5 2 13.5L12 22L22 13.5C23 12.5 23.5 11 23 10C22.5 8.5 21 8.5 20 9.5L17.5 12C18.5 11 19 9.5 18 8.5C17 7.5 15.5 7.5 14.5 8V4.5C14.5 3 13.5 2 12 2Z"
        fill="url(#palmGradientSmall)"
        opacity="0.3"
      />
      {/* Vein lines */}
      <path
        d="M12 20V10M12 10L8 6M12 10L16 6M12 14L9 11M12 14L15 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
