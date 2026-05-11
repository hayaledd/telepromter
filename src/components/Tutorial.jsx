import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Tutorial() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: 'description',
      title: t('tutorialStep1Title'),
      desc: t('tutorialStep1Desc')
    },
    {
      icon: 'text_fields',
      title: t('tutorialStep2Title'),
      desc: t('tutorialStep2Desc')
    },
    {
      icon: 'videocam',
      title: t('tutorialStep3Title'),
      desc: t('tutorialStep3Desc')
    },
    {
      icon: 'share',
      title: t('tutorialStep4Title'),
      desc: t('tutorialStep4Desc')
    },
    {
      icon: 'settings_remote',
      title: t('tutorialStep5Title'),
      desc: t('tutorialStep5Desc')
    }
  ];

  const isFirstTime = !localStorage.getItem('has_seen_onboarding');

  const handleFinish = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    navigate('/scripts', { replace: true });
  };

  const handleBack = () => {
    if (isFirstTime) return; // Prevent going back if it's the first time
    navigate(-1);
  };

  return (
    <div className="bg-[#0f0f14] text-white min-h-[100dvh] flex flex-col font-sans relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      {!isFirstTime && (
        <header className="relative z-10 px-5 pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
            </button>
            <h1 className="font-bold text-[18px] text-white tracking-tight">
              {t('tutorial')}
            </h1>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-5 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center text-center">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-teal-400/20 rounded-3xl blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[48px] text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {steps[currentStep].icon}
              </span>
            </div>
          </div>

          <h2 className="text-[22px] font-black text-white mb-3 leading-tight tracking-tight">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-white/50 leading-relaxed text-[14px] min-h-[80px]">
            {steps[currentStep].desc}
          </p>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6 mb-8">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'w-2 bg-white/10'}`}
              />
            ))}
          </div>

          <div className="flex gap-3 w-full">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-bold text-[14px] hover:bg-white/10 active:scale-95 transition-all"
              >
                {t('tutorialBack')}
              </button>
            )}
            
            <button 
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  handleFinish();
                }
              }}
              className="flex-[2] py-3.5 rounded-2xl text-white font-bold text-[14px] active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}
            >
              <span className="relative z-10">{currentStep < steps.length - 1 ? t('tutorialNext') : t('tutorialFinish')}</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
