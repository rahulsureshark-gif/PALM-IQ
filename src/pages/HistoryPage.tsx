import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, Thermometer, Hand, ArrowUpRight, ArrowDownLeft, Smartphone, Building, ChevronRight, Filter, X, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useWallet, Transaction } from '@/contexts/WalletContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { useGoBack } from '@/hooks/useBackHandler';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type FilterType = 'all' | 'palm_pay' | 'demo_upi' | 'demo_transfer' | 'credit';

const typeIcons: Record<string, React.ElementType> = {
  palm_pay: Hand,
  demo_upi: Smartphone,
  demo_transfer: Building,
  credit: ArrowDownLeft,
};

const typeLabels: Record<string, string> = {
  palm_pay: 'Palm Pay',
  demo_upi: 'UPI Payment',
  demo_transfer: 'Bank Transfer',
  credit: 'Money Added',
};

export default function HistoryPage() {
  const { transactions } = useWallet();
  const goBack = useGoBack();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = 
      txn.description.toLowerCase().includes(search.toLowerCase()) ||
      txn.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      txn.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || txn.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, txn) => {
    const date = new Date(txn.timestamp);
    let key: string;
    
    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else if (isThisWeek(date)) {
      key = 'This Week';
    } else if (isThisMonth(date)) {
      key = 'This Month';
    } else {
      key = format(date, 'MMMM yyyy');
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(txn);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const filterOptions: { value: FilterType; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'palm_pay', label: 'Palm Pay', icon: Hand },
    { value: 'demo_upi', label: 'UPI', icon: Smartphone },
    { value: 'demo_transfer', label: 'Transfer', icon: Building },
    { value: 'credit', label: 'Credits', icon: ArrowDownLeft },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-palm-success';
      case 'failed': return 'text-destructive';
      case 'pending': return 'text-palm-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <MobileLayout>
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-background z-10">
        <button onClick={goBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold">Transaction History</h1>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, merchant or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(opt.value)}
              className={`shrink-0 gap-2 ${
                filter === opt.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary/50 border-border text-foreground hover:bg-secondary'
              }`}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Transactions list */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedTransactions).map(([dateGroup, txns]) => (
              <motion.div
                key={dateGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {dateGroup}
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{txns.length}</span>
                </h3>
                <div className="space-y-2">
                  {txns.map((txn) => {
                    const Icon = typeIcons[txn.type] || ArrowUpRight;
                    return (
                      <motion.button
                        key={txn.id}
                        className="transaction-item w-full text-left"
                        onClick={() => setSelectedTxn(txn)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          txn.type === 'credit' 
                            ? 'bg-palm-success/20' 
                            : txn.type === 'palm_pay'
                            ? 'bg-primary/20'
                            : 'bg-secondary'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            txn.type === 'credit' 
                              ? 'text-palm-success' 
                              : txn.type === 'palm_pay'
                              ? 'text-primary'
                              : 'text-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{txn.merchant || txn.description}</p>
                            {txn.type === 'palm_pay' && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/20 text-primary">
                                PALM
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(txn.timestamp), 'h:mm a')}</span>
                            {txn.location && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {txn.location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${txn.type === 'credit' ? 'text-palm-success' : ''}`}>
                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </p>
                          <p className={`text-xs capitalize ${getStatusColor(txn.status)}`}>
                            {txn.status}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No transactions found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTxn} onOpenChange={() => setSelectedTxn(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTxn && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  selectedTxn.type === 'credit' 
                    ? 'bg-palm-success/20' 
                    : selectedTxn.type === 'palm_pay'
                    ? 'bg-primary/20'
                    : 'bg-secondary'
                }`}>
                  {(() => {
                    const Icon = typeIcons[selectedTxn.type] || ArrowUpRight;
                    return <Icon className={`w-7 h-7 ${
                      selectedTxn.type === 'credit' 
                        ? 'text-palm-success' 
                        : selectedTxn.type === 'palm_pay'
                        ? 'text-primary'
                        : 'text-foreground'
                    }`} />;
                  })()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedTxn.merchant || typeLabels[selectedTxn.type]}</p>
                  <p className={`text-sm capitalize ${getStatusColor(selectedTxn.status)}`}>
                    {selectedTxn.status}
                  </p>
                </div>
              </div>

              <div className="text-center py-4 border-y border-border">
                <p className={`text-3xl font-display font-bold ${selectedTxn.type === 'credit' ? 'text-palm-success' : ''}`}>
                  {selectedTxn.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTxn.amount)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{selectedTxn.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span>{typeLabels[selectedTxn.type]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span>{format(new Date(selectedTxn.timestamp), 'dd MMM yyyy, h:mm a')}</span>
                </div>
                {selectedTxn.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </span>
                    <span>{selectedTxn.location}</span>
                  </div>
                )}
                {selectedTxn.temperature && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      Body Temperature
                    </span>
                    <span>{selectedTxn.temperature}°C</span>
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setSelectedTxn(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
