import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';

export default function MobileMenu({ show, onClose, onImportClick }) {
  const navigate = useNavigate();
  const { createNewScript } = useScript();
  const { t, lang, toggleLang } = useLanguage();
  const [showAbout, setShowAbout] = useState(false);

  if (!show) return null;

  const handleCreateNew = () => {
    createNewScript('', '');
    navigate('/editor');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-72 h-full border-r border-white/5 flex flex-col pt-8 pb-6 px-4 shadow-2xl animate-in slide-in-from-left-4 duration-200" style={{ backgroundColor: 'rgba(15, 15, 20, 1)', backdropFilter: 'blur(20px)' }}>
        {/* Close Button - Positioned exactly where the hamburger menu is (pt-12 px-5) */}
        <button
          onClick={onClose}
          className="absolute top-12 left-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors border bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Top Logo - Centered */}
        <div className="flex flex-col items-center justify-center gap-2 mb-8 px-2 text-center mt-2">
          <img
            src="/favicon.png"
            alt="TelePromt"
            className="w-20 h-20 rounded-2xl object-cover mb-1 shadow-[0_0_24px_rgba(45,212,191,0.25)]"
          />
          <div>
            <p className="font-bold text-white text-[18px] tracking-tight">TelePromt</p>
            <p className="text-white/30 text-[12px] font-mono mt-0.5">v2.5.0</p>
          </div>
        </div>

        {/* Menu Items - No Icons */}
        <div className="flex flex-col gap-3 flex-1 px-2 overflow-y-auto">
          <button onClick={() => { navigate('/scripts'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('scripts')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={handleCreateNew} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('createNew')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={() => { navigate('/recordings'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('myVideos')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <div className="h-px bg-white/10 my-2 mx-2"></div>

          <button onClick={() => { navigate('/tutorial'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('tutorial')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={() => { window.open('https://telepromt.github.io/privacy', '_blank'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('privacyPolicy')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={() => { window.location.href = 'mailto:zynexapp@gmail.com'; onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('contactSupport')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={() => { window.open('https://play.google.com/store/apps/details?id=com.hayaledd.scriptflow', '_blank'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('rateApp')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={() => { setShowAbout(true); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="text-[15px] font-bold text-white">{t('about')}</span>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAbout(false)} />
          <div className="relative z-10 w-full max-w-xs rounded-3xl border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'rgba(20, 20, 25, 1)' }}>
            <div className="flex flex-col items-center text-center gap-4">
              <img
                src="/favicon.png"
                alt="TelePromt"
                className="w-16 h-16 rounded-2xl object-cover shadow-[0_0_24px_rgba(45,212,191,0.25)]"
              />
              <div>
                <h3 className="text-[18px] font-bold text-white tracking-tight">TelePromt</h3>
                <p className="text-white/30 text-[11px] font-mono mt-0.5">v2.5.0</p>
              </div>
              
              <p className="text-white/70 text-[13px] leading-relaxed px-1">
                {t('aboutDesc')}
              </p>
              
              <div className="w-full h-px bg-white/5 my-1" />
              
              <div className="text-[11px] text-white/40 flex flex-col gap-1">
                <p className="text-white/70 font-semibold">Zynex App</p>
                <p>Copyright © 2026. All rights reserved.</p>
              </div>
              
              <button
                onClick={() => setShowAbout(false)}
                className="mt-2 w-full py-3 rounded-2xl font-semibold bg-teal-500 text-black hover:bg-teal-400 active:scale-95 transition-all shadow-[0_4px_12px_rgba(45,212,191,0.2)]"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
