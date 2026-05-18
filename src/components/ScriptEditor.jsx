import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';
import MobileMenu from './MobileMenu';

export default function ScriptEditor() {
  const navigate = useNavigate();
  const { getActiveScript, updateActiveScript, globalFontSize, setGlobalFontSize, deleteScript } = useScript();
  const { t, lang } = useLanguage();

  const script = getActiveScript();
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [emptyError, setEmptyError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!script) {
      navigate('/scripts');
    }
  }, [script, navigate]);

  const scriptRef = useRef(script);
  useEffect(() => {
    scriptRef.current = script;
  }, [script]);

  useEffect(() => {
    // Sayfadan çıkıldığında (unmount) çalışır
    return () => {
      const current = scriptRef.current;
      if (current) {
        const contentEmpty = !current.content?.trim();
        if (contentEmpty) {
          deleteScript(current.id);
        }
      }
    };
  }, [deleteScript]);

  if (!script) return null;

  const handleSave = () => {
    const contentEmpty = !script.content?.trim();
    if (contentEmpty) {
      setEmptyError(true);
      setTimeout(() => setEmptyError(false), 2000);
      return;
    }
    setSaved(true);
    setIsDirty(false);
    setTimeout(() => {
      navigate('/scripts');
    }, 900);
  };

  const handleShare = async () => {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: script.title || t('untitledScript'),
        text: script.content,
        dialogTitle: t('share')
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <div className="bg-[#0f0f14] text-white font-sans antialiased min-h-screen flex flex-col overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* TopAppBar */}
      <header className="relative z-10 w-full flex items-center justify-between px-5 pt-12 landscape:pt-4 pb-4 landscape:pb-2 bg-white/5 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/scripts')}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <div className="hidden md:block">
            <h1 className="font-bold text-[16px] text-white">{t('editScript')}</h1>
            <p className="text-white/40 text-[12px] mt-0.5">{script.title || t('untitledScript')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {emptyError && (
            <span className="text-rose-400 text-[12px] font-bold flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 rounded-full border border-rose-500/20 animate-pulse">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {t('emptyScriptError') || 'Başlık veya içerik boş olamaz!'}
            </span>
          )}
          {saved && (
            <span className="text-teal-400 text-[12px] font-bold flex items-center gap-1 animate-pulse px-3 py-1.5 bg-teal-500/10 rounded-full border border-teal-500/20">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {t('saved')}
            </span>
          )}
          <button
            onClick={handleSave}
            className={`font-bold px-4 py-2 rounded-full transition-all active:scale-95 text-[13px] ${
              isDirty
                ? 'bg-teal-500 text-white shadow-[0_0_14px_rgba(20,184,166,0.5)] hover:bg-teal-400'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t('save')}
          </button>
          <button
            onClick={() => navigate('/record')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500 text-white font-bold active:scale-95 transition-transform shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            <span className="hidden md:inline text-[13px]">{t('startRec')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Script Editor */}
      <main className="relative z-10 flex-grow pb-[120px] landscape:pb-[20px] flex flex-col px-5 max-w-4xl mx-auto w-full h-screen">
        {/* Script Title Input */}
        <input
          className="w-full bg-transparent border-none text-[24px] landscape:text-[18px] font-black text-white focus:ring-0 focus:outline-none py-6 landscape:py-2 placeholder-white/20"
          placeholder={t('titlePlaceholder') || 'Metin Başlığı'}
          type="text"
          value={script.title}
          onChange={(e) => { updateActiveScript({ title: e.target.value }); setIsDirty(true); }}
        />
        {/* Script Text Area */}
        <textarea
          className="flex-grow w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none font-sans text-white/90 placeholder-white/20 py-4 landscape:py-2 leading-relaxed"
          placeholder={t('contentPlaceholder') || 'Metninizi buraya yazın...'}
          value={script.content}
          onChange={(e) => { updateActiveScript({ content: e.target.value }); setIsDirty(true); }}
          style={{ fontSize: `${globalFontSize}px` }}
        />
      </main>

      {/* Floating Editor Toolbar */}
      <div className="fixed bottom-24 landscape:bottom-4 left-1/2 -translate-x-1/2 w-auto z-40">
        <div className="bg-[#1a1a24]/90 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl py-2 px-6 flex items-center justify-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGlobalFontSize(prev => Math.max(16, prev - 4))}
              className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95"
            >
              <span className="text-[16px] font-bold">A-</span>
            </button>
            <div className="flex flex-col items-center justify-center min-w-[40px]">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">{t('size') || 'Boyut'}</span>
              <span className="font-black text-white text-[15px]">{globalFontSize}</span>
            </div>
            <button
              onClick={() => setGlobalFontSize(prev => Math.min(96, prev + 4))}
              className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95"
            >
              <span className="text-[18px] font-bold">A+</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10"></div>

            {/* Share Script */}
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 bg-white/5 hover:bg-white/10 text-white/50 hover:text-teal-400"
              title={t('share') || 'Paylaş'}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                share
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-gradient-to-t from-[#0f0f14] via-[#0f0f14]/95 to-transparent md:hidden">
        <button onClick={() => navigate('/scripts')} className="flex flex-col items-center justify-center text-white/40 p-2 hover:text-white active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[24px]">description</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-teal-500/20 text-teal-400 rounded-2xl px-6 py-2 border border-teal-500/30 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
        </button>
        <button onClick={() => navigate('/record')} className="flex flex-col items-center justify-center text-white/40 p-2 hover:text-white active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[24px]">videocam</span>
        </button>
        <button onClick={() => navigate('/recordings')} className="flex flex-col items-center justify-center text-white/40 p-2 hover:text-white active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[24px]">video_library</span>
        </button>
      </nav>

      <MobileMenu show={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
