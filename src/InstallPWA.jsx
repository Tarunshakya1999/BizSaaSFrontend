// src/InstallPWA.jsx
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🔧 InstallPWA mounted');

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isMobileSafari = window.navigator.standalone === true;
      const installed = isStandalone || isMobileSafari;
      setIsInstalled(installed);
      return installed;
    };

    checkInstalled();

    // Listen for install prompt
    const handleInstallPrompt = (e) => {
      console.log('🎯 beforeinstallprompt event FIRED!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    // App installed successfully
    const handleAppInstalled = () => {
      console.log('✅ App installed successfully');
      setShowButton(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Watch display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => {
      setIsInstalled(e.matches);
      if (e.matches) setShowButton(false);
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User installed the app');
      setShowButton(false);
    }
    setDeferredPrompt(null);
  };

  // Don't show if installed or no prompt
  if (isInstalled || !showButton) return null;

  return (
    <button
      onClick={handleInstall}
      className="fixed top-4 left-4 z-[9999] flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
      style={{ 
        zIndex: 9999,
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'inherit'
      }}
    >
      <Download className="w-4 h-4" />
      <span>Install App</span>
    </button>
  );
}