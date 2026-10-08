import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="app-banner banner-offline" style={{ margin: '8px 16px 0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <WifiOff size={16} />
        <span><strong>You are offline.</strong> Cached app shell remains accessible.</span>
      </div>
    </div>
  );
}
