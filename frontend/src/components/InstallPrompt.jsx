import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = localStorage.getItem('fitquest_pwa_dismissed');
    if (isDismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('fitquest_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="app-banner banner-install" style={{ margin: '8px 16px 0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Download size={18} />
        <span>Install <strong>FitQuest AI</strong> to home screen</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button 
          onClick={handleInstall} 
          className="btn btn-primary" 
          style={{ minHeight: '32px', height: '32px', padding: '0 12px', fontSize: '12px' }}
        >
          Install
        </button>
        <button 
          onClick={handleDismiss} 
          className="btn btn-icon" 
          style={{ minHeight: '32px', height: '32px', width: '32px', background: 'transparent' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
