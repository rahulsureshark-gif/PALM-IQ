import { motion } from 'framer-motion';
import { Thermometer, Heart, Activity, Wind, AlertTriangle, TrendingUp, ArrowLeft } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { HealthMetricCard } from '@/components/ui/HealthMetricCard';
import { useHealth } from '@/contexts/HealthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useGoBack } from '@/hooks/useBackHandler';

export default function HealthPage() {
  const goBack = useGoBack();
  const { readings, alerts, latestReading, averageTemperature, acknowledgeAlert } = useHealth();

  // Prepare chart data (last 7 readings)
  const chartData = readings.slice(0, 7).reverse().map((reading) => ({
    time: format(new Date(reading.timestamp), 'HH:mm'),
    temperature: reading.temperature,
    heartRate: reading.heartRate,
  }));

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <MobileLayout>
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-background z-10">
        <button onClick={goBack} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold">Palm Health</h1>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Alerts */}
        {unacknowledgedAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {unacknowledgedAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  alert.severity === 'critical' 
                    ? 'bg-destructive/10 border-destructive/30' 
                    : 'bg-palm-warning/10 border-palm-warning/30'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${
                  alert.severity === 'critical' ? 'text-destructive' : 'text-palm-warning'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(alert.timestamp), 'dd MMM, HH:mm')}
                  </p>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="text-sm text-primary hover:underline"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Current metrics */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-4">Current Readings</h2>
          <div className="grid grid-cols-2 gap-3">
            <HealthMetricCard
              title="Body Temp"
              value={latestReading?.temperature || 36.5}
              unit="°C"
              icon={Thermometer}
              trend="stable"
              trendValue={`Avg: ${averageTemperature}°C`}
              color="health"
            />
            <HealthMetricCard
              title="Heart Rate"
              value={latestReading?.heartRate || 72}
              unit="bpm"
              icon={Heart}
              trend="stable"
              isDemo
              color="primary"
            />
            <HealthMetricCard
              title="SpO2"
              value={latestReading?.spo2 || 98}
              unit="%"
              icon={Activity}
              trend="stable"
              isDemo
              color="success"
            />
            <HealthMetricCard
              title="Stress Level"
              value={latestReading?.stressLevel || 3}
              unit="/10"
              icon={Wind}
              trend="down"
              trendValue="Low stress"
              isDemo
              color="warning"
            />
          </div>
        </div>

        {/* Temperature trend chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-primary" />
              Temperature Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[35.5, 38.5]} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <ReferenceLine 
                    y={37.5} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Fever', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="hsl(var(--palm-health))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--palm-health))', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--palm-health))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent readings */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-4">Recent Readings</h2>
          <div className="space-y-2">
            {readings.slice(0, 5).map((reading) => (
              <motion.div
                key={reading.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div>
                  <p className="font-medium">
                    {format(new Date(reading.timestamp), 'dd MMM, HH:mm')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    During palm scan
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-4 h-4 text-palm-health" />
                    {reading.temperature}°C
                  </span>
                  {reading.heartRate && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      {reading.heartRate}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-muted text-center">
          <p className="text-xs text-muted-foreground">
            <strong>Health Data Disclaimer:</strong> Temperature readings are captured via MLX90614 sensor. 
            Heart rate, SpO2, and stress metrics are simulated for demo purposes. 
            This is not medical advice.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
