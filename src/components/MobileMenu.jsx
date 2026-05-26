import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';

export default function MobileMenu({ show, onClose, onImportClick }) {
  const navigate = useNavigate();
  const { createNewScript } = useScript();
  const { t, lang, toggleLang } = useLanguage();

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

        </div>
      </div>
    </div>
  );
}
