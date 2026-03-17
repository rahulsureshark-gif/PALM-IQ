import { motion } from 'framer-motion';
import { Bell, AlertTriangle, CheckCircle, Info, X, Trash2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useHealth } from '@/contexts/HealthContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const { alerts, acknowledgeAlert } = useHealth();

  const sortedAlerts = [...alerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical') return AlertTriangle;
    if (type === 'temperature') return AlertTriangle;
    return Info;
  };

  const getAlertStyle = (severity: string, acknowledged: boolean) => {
    if (acknowledged) {
      return 'bg-secondary/30 border-border opacity-60';
    }
    if (severity === 'critical') {
      return 'bg-destructive/20 border-destructive/30';
    }
    return 'bg-palm-warning/20 border-palm-warning/30';
  };

  return (
    <MobileLayout title="Notifications">
      <div className="p-4 space-y-4">
        {sortedAlerts.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {alerts.filter(a => !a.acknowledged).length} unread
              </p>
              {alerts.some(a => !a.acknowledged) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => alerts.forEach(a => !a.acknowledged && acknowledgeAlert(a.id))}
                >
                  Mark all read
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {sortedAlerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type, alert.severity);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border ${getAlertStyle(alert.severity, alert.acknowledged)}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.severity === 'critical' ? 'bg-destructive/20' : 'bg-palm-warning/20'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-destructive' : 'text-palm-warning'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${alert.acknowledged ? 'text-muted-foreground' : ''}`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(alert.timestamp), 'dd MMM yyyy, h:mm a')}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <button 
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      {alert.acknowledged && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3" />
                          Acknowledged
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground text-center">
              You have no notifications at the moment.
            </p>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
