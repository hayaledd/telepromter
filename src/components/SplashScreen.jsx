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
        return p + 2;
      });
    }, 40); // 100 * 40 = 4000ms but it will navigate before

    const timer = setTimeout(() => {
      navigate('/scripts');
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="bg-black text-on-background min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-body-md dark">
      {/* Deep Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-primary rounded-full mix-blend-screen filter blur-[150px] opacity-[0.15] animate-pulse pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center justify-center space-y-8 w-full max-w-md px-8 relative">
        
        {/* Animated Rings Icon */}
        <div className="relative group flex items-center justify-center">
          {/* Pulsing Outer Ring */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }}></div>
          {/* Solid Glass Center */}
          <div className="relative w-28 h-28 rounded-full flex items-center justify-center bg-surface-container-lowest/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-10">
            <div className="absolute inset-0 rounded-full border-t border-white/30"></div>
            <span className="material-symbols-outlined text-[56px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              video_camera_front
            </span>
          </div>
        </div>
        
        {/* Typography */}
        <div className="text-center space-y-2">
          <h1 className="font-display-xl text-[40px] font-black text-white tracking-tighter drop-shadow-2xl">
            Tele<span className="text-primary">Promt</span>
          </h1>
          <p className="font-body-lg text-on-surface-variant text-[14px] font-medium tracking-wide max-w-[250px] mx-auto opacity-80">
            {t('splashTagline')}
          </p>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[60%] max-w-[200px] z-10">
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-fixed rounded-full shadow-[0_0_10px_rgba(173,198,255,0.8)] transition-all ease-out"
            style={{ width: `${progress}%`, transitionDuration: '40ms' }}
          ></div>
        </div>
        <p className="text-center text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mt-3 opacity-50">
            {t('splashLoading')}
          </p>
      </div>
    </div>
  );
}
