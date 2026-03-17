import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface HealthReading {
  id: string;
  timestamp: Date;
  temperature: number;
  heartRate?: number;
  spo2?: number;
  stressLevel?: number;
}

export interface HealthAlert {
  id: string;
  type: 'temperature' | 'heart_rate' | 'stress';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

interface HealthContextType {
  readings: HealthReading[];
  alerts: HealthAlert[];
  latestReading: HealthReading | null;
  addReading: (reading: Omit<HealthReading, 'id' | 'timestamp'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  averageTemperature: number;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

const generateDemoReadings = (): HealthReading[] => {
  const readings: HealthReading[] = [];
  const now = Date.now();
  for (let i = 0; i < 14; i++) {
    const baseTemp = 36.5;
    const tempVariation = (Math.random() - 0.5) * 0.6;
    readings.push({
      id: `demo_${i}`,
      timestamp: new Date(now - i * 12 * 60 * 60 * 1000),
      temperature: parseFloat((baseTemp + tempVariation).toFixed(1)),
      heartRate: 65 + Math.floor(Math.random() * 25),
      spo2: 96 + Math.floor(Math.random() * 4),
      stressLevel: 2 + Math.floor(Math.random() * 4),
    });
  }
  return readings;
};

function getReadingsKey(userId: string) { return `palmiq_health_readings_${userId}`; }
function getAlertsKey(userId: string) { return `palmiq_health_alerts_${userId}`; }

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);

  const loadData = useCallback((userId: string) => {
    try {
      const savedReadings = localStorage.getItem(getReadingsKey(userId));
      if (savedReadings) {
        setReadings(JSON.parse(savedReadings, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        }));
      } else {
        const demo = generateDemoReadings();
        setReadings(demo);
        localStorage.setItem(getReadingsKey(userId), JSON.stringify(demo));
      }

      const savedAlerts = localStorage.getItem(getAlertsKey(userId));
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        }));
      }
    } catch {
      setReadings(generateDemoReadings());
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData(user.id);
    } else {
      setReadings(generateDemoReadings());
      setAlerts([]);
    }
  }, [user, loadData]);

  const latestReading = readings.length > 0 ? readings[0] : null;

  const averageTemperature = readings.length > 0
    ? parseFloat((readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length).toFixed(1))
    : 36.5;

  const addReading = (reading: Omit<HealthReading, 'id' | 'timestamp'>) => {
    const newReading: HealthReading = { ...reading, id: `reading_${Date.now()}`, timestamp: new Date() };
    setReadings((prev) => {
      const next = [newReading, ...prev];
      if (user) localStorage.setItem(getReadingsKey(user.id), JSON.stringify(next));
      return next;
    });

    if (reading.temperature > 37.5) {
      const newAlert: HealthAlert = {
        id: `alert_${Date.now()}`,
        type: 'temperature',
        message: `Elevated temperature detected: ${reading.temperature}°C`,
        severity: reading.temperature > 38.5 ? 'critical' : 'warning',
        timestamp: new Date(),
        acknowledged: false,
      };
      setAlerts((prev) => {
        const next = [newAlert, ...prev];
        if (user) localStorage.setItem(getAlertsKey(user.id), JSON.stringify(next));
        return next;
      });
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => {
      const next = prev.map((a) => a.id === alertId ? { ...a, acknowledged: true } : a);
      if (user) localStorage.setItem(getAlertsKey(user.id), JSON.stringify(next));
      return next;
    });
  };

  return (
    <HealthContext.Provider value={{ readings, alerts, latestReading, addReading, acknowledgeAlert, averageTemperature }}>
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth() {
  const context = useContext(HealthContext);
  if (context === undefined) throw new Error('useHealth must be used within a HealthProvider');
  return context;
}
