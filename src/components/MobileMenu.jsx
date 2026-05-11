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
      <div className="relative z-10 w-72 h-full border-r border-white/5 flex flex-col py-8 px-4 shadow-2xl animate-in slide-in-from-left-4 duration-200" style={{ backgroundColor: 'rgba(15, 15, 20, 1)', backdropFilter: 'blur(20px)' }}>
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
          <button onClick={() => { navigate('/scripts'); onClose(); }} className="btn-icon">
            <div className="icon-wrap text-primary">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">{t('scripts')}</span>
              <span className="text-[11px] text-white/40">Tüm metinleriniz</span>
            </div>
            <span className="material-symbols-outlined arrow text-white ml-auto">chevron_right</span>
          </button>
          <button onClick={handleCreateNew} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
            <span>{t('createNew')}</span>
          </button>
          <button onClick={() => { navigate('/recordings'); onClose(); }} className="btn-icon">
            <div className="icon-wrap" style={{ background: 'rgba(0,220,229,0.12)', color: '#00dce5' }}>
              <span className="material-symbols-outlined">video_library</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">{t('myVideos')}</span>
              <span className="text-[11px] text-white/40">Kayıtlı videolar</span>
            </div>
            <span className="material-symbols-outlined arrow text-white ml-auto">chevron_right</span>
          </button>
          <div className="h-[1px] bg-white/10 my-2 mx-4"></div>
          <button onClick={() => { navigate('/tutorial'); onClose(); }} className="btn-icon">
            <div className="icon-wrap text-amber-400" style={{ background: 'rgba(251, 191, 36, 0.12)' }}>
              <span className="material-symbols-outlined">school</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">{t('tutorial')}</span>
              <span className="text-[11px] text-white/40">Adım adım öğren</span>
            </div>
            <span className="material-symbols-outlined arrow text-white ml-auto">chevron_right</span>
          </button>
          <button className="btn-icon opacity-50 cursor-not-allowed">
            <div className="icon-wrap text-emerald-400" style={{ background: 'rgba(52, 211, 153, 0.12)' }}>
              <span className="material-symbols-outlined">cloud_sync</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-white">Bulut Senkron</span>
              <span className="text-[11px] text-white/40">Yakında</span>
            </div>
          </button>
        </div>
        <button onClick={toggleLang} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 transition-colors border border-white/10">
          <span className="material-symbols-outlined">language</span>
          <span>{t('langSwitch')}</span>
        </button>
      </div>
    </div>
  );
}
