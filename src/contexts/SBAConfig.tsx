import React, { createContext, useContext, ReactNode } from 'react';
import { SBAConfig } from '@/types';

const SBAConfigContext = createContext<SBAConfig | undefined>(undefined);

interface SBAConfigProviderProps {
  children: ReactNode;
}

export function SBAConfigProvider({ children }: SBAConfigProviderProps) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-backend.onrender.com';
  
  // Show configuration notice in development
  if (!import.meta.env.VITE_API_BASE_URL && import.meta.env.DEV) {
    console.warn('⚠️ Using default API URL for development. Create .env.local to customize.');
  }

  const config: SBAConfig = { apiBaseUrl };

  return (
    <SBAConfigContext.Provider value={config}>
      {children}
    </SBAConfigContext.Provider>
  );
}

export function useSBAConfig(): SBAConfig {
  const context = useContext(SBAConfigContext);
  if (!context) {
    throw new Error('useSBAConfig must be used within SBAConfigProvider');
  }
  return context;
}