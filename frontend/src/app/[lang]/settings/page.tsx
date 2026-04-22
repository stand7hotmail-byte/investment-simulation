"use client";

import { useI18n } from "@/hooks/useI18n";

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('settings.title')}</h1>
      <p className="text-slate-500">
        {t('settings.comingSoon')}
      </p>
    </div>
  );
}
