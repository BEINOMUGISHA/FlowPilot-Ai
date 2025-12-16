
import React from 'react';
import { WifiOff } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useAppContext();
  const { t } = useTranslation();

  if (!isOffline) return null;

  return (
    <div className="bg-slate-800 text-white px-4 py-2 text-sm flex items-center justify-center space-x-2 animate-in slide-in-from-top-full">
      <WifiOff size={14} />
      <span>{t('offline.banner')}</span>
    </div>
  );
};
