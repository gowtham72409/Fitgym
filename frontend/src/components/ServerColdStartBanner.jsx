import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { setServerWakingListener } from '../services/api';

export default function ServerColdStartBanner() {
  const [isWaking, setIsWaking] = useState(false);

  useEffect(() => {
    setServerWakingListener(setIsWaking);
    return () => setServerWakingListener(null);
  }, []);

  if (!isWaking) return null;

  return (
    <div className="app-banner banner-waking" style={{ margin: '8px 16px 0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Loader2 size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Connecting to FitQuest AI cloud service...</span>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
