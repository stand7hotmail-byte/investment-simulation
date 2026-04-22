'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { translate } from '@/lib/i18n';

interface I18nContextProps {
  lang: string;
  t: (key: string, variables?: Record<string, string | number>) => string;
  dictionary: any;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ 
  children, 
  lang, 
  dictionary 
}: { 
  children: ReactNode; 
  lang: string; 
  dictionary: any;
}) {
  const t = (key: string, variables?: Record<string, string | number>) => {
    return translate(dictionary, key, variables);
  };

  return (
    <I18nContext.Provider value={{ lang, t, dictionary }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
