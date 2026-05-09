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
    }
  ];

  return (
    <div className="bg-background text-on-background min-h-[100dvh] flex flex-col font-body-md dark">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-container/80 backdrop-blur-xl border-b border-white/5 px-edge-margin-mobile pt-[max(env(safe-area-inset-top),24px)] pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-display text-[24px] font-bold text-white tracking-tight">
            {t('tutorial')}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-edge-margin-mobile py-8 flex flex-col items-center">
        <div className="w-full max-w-md bg-surface-container-low border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 relative">
              <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {steps[currentStep].icon}
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-4 leading-tight">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-on-surface-variant text-center leading-relaxed text-[15px] min-h-[80px]">
            {steps[currentStep].desc}
          </p>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8 mb-8">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-surface-variant'}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 py-4 rounded-2xl bg-surface-variant text-on-surface-variant font-bold text-[15px] active:scale-95 transition-transform"
              >
                {t('tutorialBack')}
              </button>
            )}
            
            <button 
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  navigate(-1);
                }
              }}
              className="flex-[2] py-4 rounded-2xl bg-primary text-on-primary font-bold text-[15px] active:scale-95 transition-transform shadow-[0_0_20px_rgba(173,198,255,0.2)]"
            >
              {currentStep < steps.length - 1 ? t('tutorialNext') : t('tutorialFinish')}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
