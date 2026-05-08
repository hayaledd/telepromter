import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/scripts');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="bg-background text-on-background min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container dark">
      {/* Ambient Glassmorphism Orbs (Background) */}
      <div className="absolute top-[15%] left-[20%] w-[40vw] h-[40vw] max-w-lg max-h-lg bg-primary-container rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[15%] w-[50vw] h-[50vw] max-w-xl max-h-xl bg-secondary-container rounded-full mix-blend-screen filter blur-[150px] opacity-15 pointer-events-none"></div>

      {/* Central Content Canvas (Highest Z-Index) */}
      <div className="z-10 flex flex-col items-center justify-center space-y-md w-full max-w-md px-gutter">
        {/* Glowing Brand Logo Element */}
        <div className="relative group">
          {/* Outer Neon Glow Simulation */}
          <div className="absolute inset-0 bg-primary rounded-full blur-[40px] opacity-30 transition-opacity duration-1000"></div>
          {/* Glass Housing */}
          <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-white/[0.03] backdrop-blur-[16px] border border-white/[0.12] shadow-2xl">
            {/* Inner Light Refraction */}
            <div className="absolute inset-0 rounded-full border-t border-white/[0.2] pointer-events-none"></div>
            {/* Iconography */}
            <span className="material-symbols-outlined text-[64px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
          </div>
        </div>
        
        {/* Typography Anchor */}
        <h1 className="font-display-xl text-display-xl text-on-surface tracking-tight mt-sm text-center">ScriptFlow</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant text-center max-w-xs">The intelligent prompter for modern speakers.</p>
      </div>

      {/* Bottom Interface Anchors */}
      <div className="absolute bottom-margin left-0 w-full flex flex-col items-center px-gutter space-y-md z-10">
        {/* Progress / Loading Indication */}
        <div className="w-full max-w-xs h-1 bg-surface-container-highest rounded-full overflow-hidden shadow-inner relative">
          {/* Simulated Loading Progress (60%) with glowing head */}
          <div className="absolute top-0 left-0 h-full w-[60%] bg-gradient-to-r from-primary-container to-primary rounded-full relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[8px] opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
