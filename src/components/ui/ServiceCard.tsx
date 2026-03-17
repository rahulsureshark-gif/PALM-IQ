import { motion } from 'framer-motion';
import { LucideIcon, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'health' | 'disabled';
  comingSoon?: boolean;
  badge?: string;
}

const variantStyles = {
  primary: 'bg-gradient-to-br from-primary/20 to-accent/10 border-primary/30 hover:border-primary/60',
  secondary: 'bg-secondary/50 border-border hover:border-primary/40',
  health: 'bg-gradient-to-br from-palm-health/10 to-pink-500/5 border-palm-health/30 hover:border-palm-health/60',
  disabled: 'bg-secondary/30 border-border/50 cursor-not-allowed opacity-60',
};

const iconVariantStyles = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-foreground',
  health: 'bg-palm-health text-white',
  disabled: 'bg-muted text-muted-foreground',
};

export function ServiceCard({
  title,
  description,
  icon: Icon,
  to,
  onClick,
  variant = 'secondary',
  comingSoon = false,
  badge,
}: ServiceCardProps) {
  const content = (
    <motion.div
      className={`relative p-4 rounded-2xl border transition-all duration-300 ${variantStyles[variant]}`}
      whileHover={variant !== 'disabled' ? { scale: 1.02, y: -2 } : {}}
      whileTap={variant !== 'disabled' ? { scale: 0.98 } : {}}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
          {badge}
        </span>
      )}

      {/* Coming soon overlay */}
      {comingSoon && (
        <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Coming Soon
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${iconVariantStyles[variant]} shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        </div>
      </div>
    </motion.div>
  );

  if (comingSoon || variant === 'disabled') {
    return content;
  }

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }

  return content;
}
