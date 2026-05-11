import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 3;
      });
    }, 40);

    const timer = setTimeout(() => {
      navigate('/scripts');
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="bg-[#0f0f14] text-white min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="z-10 flex flex-col items-center justify-center space-y-8 w-full max-w-md px-8">
        
        {/* Logo Icon */}
        <div className="relative group">
          <div className="absolute inset-0 bg-teal-400/20 rounded-[32px] blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-[32px] bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
             <span className="material-symbols-outlined text-[48px] text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>
              video_camera_front
            </span>
          </div>
        </div>
        
        {/* Typography */}
        <div className="text-center">
          <h1 className="text-[44px] font-black text-white tracking-tighter leading-none">
            Tele<span className="text-teal-400">Promt</span>
          </h1>
          <p className="text-white/30 text-[14px] font-medium tracking-wide mt-3 max-w-[200px] mx-auto leading-relaxed">
            {t('splashTagline') || 'Profesyonel Video Deneyimi'}
          </p>
        </div>
      </div>

      {/* Loading Progress */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[180px] z-10 flex flex-col items-center">
        <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-teal-400 transition-all duration-75 ease-out shadow-[0_0_15px_rgba(45,212,191,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-white/20 font-black tracking-[0.2em] uppercase mt-4">
            {t('splashLoading') || 'HAZIRLANIYOR'}
          </p>
      </div>
    </div>
  );
}

