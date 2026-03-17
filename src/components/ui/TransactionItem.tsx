import { motion } from 'framer-motion';
import { Hand, ArrowUpRight, ArrowDownLeft, Smartphone, Building, Check, X, Clock } from 'lucide-react';
import type { Transaction } from '@/contexts/WalletContext';
import { format } from 'date-fns';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

const typeIcons = {
  palm_pay: Hand,
  demo_upi: Smartphone,
  demo_transfer: Building,
  credit: ArrowDownLeft,
};

const typeColors = {
  palm_pay: 'bg-primary/20 text-primary',
  demo_upi: 'bg-accent/20 text-accent',
  demo_transfer: 'bg-secondary text-foreground',
  credit: 'bg-palm-success/20 text-palm-success',
};

const statusIcons = {
  success: Check,
  failed: X,
  pending: Clock,
};

const statusColors = {
  success: 'text-palm-success',
  failed: 'text-destructive',
  pending: 'text-palm-warning',
};

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const Icon = typeIcons[transaction.type];
  const StatusIcon = statusIcons[transaction.status];
  const isDebit = transaction.type !== 'credit';

  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-secondary/50 transition-colors text-left"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <div className={`p-3 rounded-xl ${typeColors[transaction.type]}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground truncate">
            {transaction.merchant || transaction.description}
          </h4>
          <StatusIcon className={`w-4 h-4 ${statusColors[transaction.status]}`} />
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(transaction.timestamp), 'dd MMM, hh:mm a')}
          {transaction.location && ` • ${transaction.location}`}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className={`font-semibold ${isDebit ? 'text-foreground' : 'text-palm-success'}`}>
          {isDebit ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
        </p>
        {transaction.temperature && (
          <p className="text-xs text-palm-health">{transaction.temperature}°C</p>
        )}
      </div>
    </motion.button>
  );
}
