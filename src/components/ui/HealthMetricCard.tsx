import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthMetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  isDemo?: boolean;
  color?: 'primary' | 'health' | 'warning' | 'success';
}

const colorStyles = {
  primary: {
    bg: 'from-primary/20 to-primary/5',
    icon: 'bg-primary text-primary-foreground',
    text: 'text-primary',
  },
  health: {
    bg: 'from-palm-health/20 to-palm-health/5',
    icon: 'bg-palm-health text-white',
    text: 'text-palm-health',
  },
  warning: {
    bg: 'from-palm-warning/20 to-palm-warning/5',
    icon: 'bg-palm-warning text-white',
    text: 'text-palm-warning',
  },
  success: {
    bg: 'from-palm-success/20 to-palm-success/5',
    icon: 'bg-palm-success text-white',
    text: 'text-palm-success',
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function HealthMetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  isDemo = false,
  color = 'primary',
}: HealthMetricCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;
  const styles = colorStyles[color];

  return (
    <motion.div
      className={`relative p-4 rounded-2xl bg-gradient-to-br ${styles.bg} border border-border overflow-hidden`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Demo badge */}
      {isDemo && (
        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
          DEMO
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${styles.icon} shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-display font-bold text-foreground">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
      </div>

      {/* Trend */}
      {trend && TrendIcon && (
        <div className={`mt-3 flex items-center gap-1 text-xs ${
          trend === 'up' ? 'text-palm-success' :
          trend === 'down' ? 'text-destructive' :
          'text-muted-foreground'
        }`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendValue || (trend === 'stable' ? 'Stable' : trend === 'up' ? 'Increasing' : 'Decreasing')}</span>
        </div>
      )}
    </motion.div>
  );
}
