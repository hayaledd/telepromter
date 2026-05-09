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
    createNewScript(t('untitledScript'), t('contentPlaceholder'));
    navigate('/editor');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-72 h-full bg-surface-container-lowest border-r border-white/5 flex flex-col py-8 px-4 shadow-2xl animate-in slide-in-from-left-4 duration-200">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
          </div>
          <div>
            <p className="font-bold text-white text-[16px]">TelePromt</p>
            <p className="text-white/40 text-[12px]">v2.5.0</p>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <button onClick={() => { navigate('/scripts'); onClose(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/15 text-primary font-bold transition-colors">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            <span>{t('myScripts')}</span>
          </button>
          <button onClick={handleCreateNew} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
            <span>{t('createNew')}</span>
          </button>
          <button onClick={() => { navigate('/recordings'); onClose(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined">video_library</span>
            <span>Videolarım</span>
          </button>
          <div className="h-[1px] bg-white/10 my-2 mx-4"></div>
          <button onClick={() => { navigate('/tutorial'); onClose(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined">help</span>
            <span>{t('tutorial') || 'Nasıl Kullanılır?'}</span>
          </button>
        </div>
        <button onClick={toggleLang} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 transition-colors border border-white/10">
          <span className="material-symbols-outlined">language</span>
          <span>{lang === 'tr' ? 'Switch to English' : "Türkçe'ye Geç"}</span>
        </button>
      </div>
    </div>
  );
}
