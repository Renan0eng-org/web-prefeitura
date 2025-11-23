"use client";
import { createContext, ReactNode, useContext, useState } from 'react';

type AlertType = "success" | "error" | "info" | "warning" | null | undefined;

export type AlertItem = {
  id: string;
  message: string;
  type?: AlertType;
  time?: number; // duration in ms
};

interface AlertContextType {
  alerts: AlertItem[];
  setAlert: (
    alertMessage: string,
    alertType?: AlertType,
    alertTime?: number
  ) => void;
  removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter(a => a.id !== id));
  }

  const setAlert = (
    alertMessage: string,
    alertType: AlertType = 'success',
    alertTime: number = 5000
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: AlertItem = { id, message: alertMessage, type: alertType, time: alertTime };
    setAlerts((prev) => [item, ...prev]);

    // auto remove after time
    if (alertTime && alertTime > 0) {
      setTimeout(() => removeAlert(id), alertTime);
    }
  };

  return (
    <AlertContext.Provider value={{ alerts, setAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
