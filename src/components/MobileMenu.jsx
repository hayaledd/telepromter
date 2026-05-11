import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';

export default function MobileMenu({ show, onClose, onImportClick }) {
  const navigate = useNavigate();
  const { createNewScript } = useScript();
  const { t, lang, toggleLang, theme, toggleTheme } = useLanguage();

  if (!show) return null;

  const handleCreateNew = () => {
    createNewScript(t('untitledScript'), t('contentPlaceholder'));
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
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-1 shadow-[0_0_15px_rgba(173,198,255,0.2)]">
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
          </div>
          <div>
            <p className="font-bold text-white text-[18px] tracking-tight">TelePromt</p>
            <p className="text-white/30 text-[12px] font-mono mt-0.5">v2.5.0</p>
          </div>
        </div>

        {/* Menu Items - No Icons */}
        <div className="flex flex-col gap-3 flex-1 px-2">
          <button onClick={() => { navigate('/scripts'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">{t('scripts')}</span>
              <span className="text-[11px] text-white/40 mt-0.5">Tüm metinleriniz</span>
            </div>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={handleCreateNew} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">{t('createNew')}</span>
              <span className="text-[11px] text-white/40 mt-0.5">Yeni metin oluştur</span>
            </div>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button onClick={() => { navigate('/recordings'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">{t('myVideos')}</span>
              <span className="text-[11px] text-white/40 mt-0.5">Kayıtlı videolar</span>
            </div>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <div className="h-px bg-white/10 my-2 mx-2"></div>

          <button onClick={() => { navigate('/tutorial'); onClose(); }} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95">
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">{t('tutorial')}</span>
              <span className="text-[11px] text-white/40 mt-0.5">Adım adım öğren</span>
            </div>
            <span className="material-symbols-outlined text-white/20">chevron_right</span>
          </button>

          <button className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 opacity-50 cursor-not-allowed">
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">Bulut Senkron</span>
              <span className="text-[11px] text-white/40 mt-0.5">Yakında Eklenecek</span>
            </div>
            <span className="material-symbols-outlined text-white/20">cloud_sync</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 mt-auto mx-2">
          <button onClick={toggleLang} className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-white/40 hover:bg-white/5 transition-colors border border-white/10">
            <span className="material-symbols-outlined text-[16px]">language</span>
            <span className="font-bold text-[12px]">{lang === 'tr' ? 'EN' : 'TR'}</span>
          </button>
          <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-white/40 hover:bg-white/5 transition-colors border border-white/10">
            <span className="material-symbols-outlined text-[16px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <span className="font-bold text-[12px]">{theme === 'dark' ? 'Açık' : 'Koyu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
