import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';
import MobileMenu from './MobileMenu';

export default function ScriptEditor() {
  const navigate = useNavigate();
  const { getActiveScript, updateActiveScript, globalFontSize, setGlobalFontSize } = useScript();
  const { t } = useLanguage();

  const script = getActiveScript();
  const [saved, setSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!script) {
      navigate('/scripts');
    }
  }, [script, navigate]);

  if (!script) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      navigate('/scripts');
    }, 900);
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col overflow-hidden dark">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-control-bar-height bg-surface-container-lowest border-b border-surface-container-low">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setShowMenu(true)}
            aria-label="Menu" 
            className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-full p-2 active:scale-95 duration-100 block"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <button 
            onClick={() => navigate('/scripts')}
            aria-label="Back" 
            className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-full p-2 active:scale-95 duration-100 hidden md:block"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-on-surface hidden md:block">{t('editScript')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-green-400 text-[13px] font-bold flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {t('saved')}
            </span>
          )}
          <button 
            onClick={handleSave}
            className="text-primary font-bold px-4 py-2 rounded-full hover:bg-primary-container/50 transition-colors active:scale-95 text-[14px]"
          >
            {t('save')}
          </button>
          <button 
            onClick={() => navigate('/record')}
            className="bg-primary text-on-primary font-headline-md text-body-md px-4 py-2 md:px-6 rounded-full hover:bg-primary-fixed transition-colors active:scale-95 duration-100 flex items-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            <span className="hidden md:inline">{t('startRec')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Script Editor */}
      <main className="flex-grow pt-control-bar-height pb-[100px] flex flex-col md:px-edge-margin-tablet px-edge-margin-mobile max-w-4xl mx-auto w-full relative h-screen">
        {/* Script Title Input */}
        <input 
          className="w-full bg-transparent border-none text-headline-md font-headline-md text-on-surface focus:ring-0 focus:outline-none py-6 placeholder-on-surface-variant/50" 
          placeholder={t('titlePlaceholder')} 
          type="text" 
          value={script.title}
          onChange={(e) => updateActiveScript({ title: e.target.value })}
        />
        {/* Script Text Area */}
        <textarea 
          className="flex-grow w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none font-prompter-standard text-on-surface placeholder-on-surface-variant/30 py-4" 
          placeholder={t('contentPlaceholder')}
          value={script.content}
          onChange={(e) => updateActiveScript({ content: e.target.value })}
          style={{ fontSize: `${globalFontSize}px`, lineHeight: 1.4 }}
        />
      </main>

      {/* Floating Editor Toolbar */}
      <div className="fixed bottom-[calc(72px+16px)] md:bottom-gutter left-1/2 transform -translate-x-1/2 w-[calc(100%-32px)] md:w-auto md:min-w-[400px] z-40">
        <div className="bg-surface-container-high rounded-full border border-outline-variant/30 shadow-lg p-2 flex items-center justify-between gap-6 px-6">
          {/* Font Size Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setGlobalFontSize(prev => Math.max(16, prev - 4))}
              aria-label="Decrease Font Size" 
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full p-2 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">text_decrease</span>
            </button>
            <span className="font-body-md text-on-surface-variant select-none w-10 text-center">{globalFontSize}</span>
            <button 
              onClick={() => setGlobalFontSize(prev => Math.min(96, prev + 4))}
              aria-label="Increase Font Size" 
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full p-2 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[24px]">text_increase</span>
            </button>
          </div>
        </div>
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-edge-margin-mobile py-2 bg-surface-container border-t border-surface-container-high md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        <button onClick={() => navigate('/scripts')} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>description</span>
          <span className="font-label-caps text-label-caps mt-1">{t('scripts')}</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1 active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
          <span className="font-label-caps text-label-caps mt-1">{t('editor')}</span>
        </button>
        <button onClick={() => navigate('/record')} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>videocam</span>
          <span className="font-label-caps text-label-caps mt-1">{t('record')}</span>
        </button>
        <button onClick={() => navigate('/scripts')} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
          <span className="font-label-caps text-label-caps mt-1">{t('settings')}</span>
        </button>
      </nav>
      {/* Mobile Menu */}
      <MobileMenu show={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
