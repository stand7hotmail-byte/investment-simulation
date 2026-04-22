"use client";

import React from 'react';
import { useI18n } from '@/hooks/useI18n';

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="mt-auto py-6 border-t border-border text-muted-foreground text-xs leading-relaxed">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-muted/30 p-4 rounded-lg">
          <p className="font-semibold mb-2">{t('footer.disclaimerTitle')}</p>
          <p>
            {t('footer.disclaimerText1')}
          </p>
          <p className="mt-2">
            {t('footer.disclaimerText2')}
          </p>
        </div>
        <div className="mt-4 text-center">
          <p>&copy; {new Date().getFullYear()} InvestSim. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
