import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../context/LanguageContext';
import MobileMenu from './MobileMenu';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// At speed 5 (normal) = ~150 wpm. Speed range 1-10 maps to 30-300 wpm.
function estimatedReadTime(text, speed = 5) {
  const wpm = speed * 30;
  const words = wordCount(text);
  const totalSeconds = Math.round((words / wpm) * 60);
  if (totalSeconds < 60) return `~${totalSeconds}sn`;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return secs > 0 ? `~${mins}dk ${secs}sn` : `~${mins}dk`;
}

export default function MyScripts() {
  const navigate = useNavigate();
  const { scripts, setActiveScriptId, createNewScript, importScript, deleteScript } = useScript();
  const { t, lang, setLanguage } = useLanguage();
  const fileInputRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_onboarding');
    if (!hasSeen) {
      navigate('/tutorial', { replace: true });
    }
  }, [navigate]);

  const handleOpenScript = (id) => {
    setActiveScriptId(id);
    navigate('/editor');
  };

  const handleRecord = (id) => {
    setActiveScriptId(id);
    navigate('/record');
  };

  const handleCreateNew = () => {
    createNewScript('', '');
    navigate('/editor');
  };

  const [importing, setImporting] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const name = file.name.replace(/\.[^/.]+$/, '');
    const ext = file.name.split('.').pop().toLowerCase();
    e.target.value = null;
    setImporting(true);
    try {
      let text = '';
      if (ext === 'txt') {
        text = await file.text();
      } else if (ext === 'docx' || ext === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map(item => item.str).join(' '));
        }
        text = pages.join('\n\n');
      }
      importScript(name, text);
      navigate('/editor');
    } catch (err) {
      console.error('Import error:', err);
      alert('Dosya okunamadı. Lütfen geçerli bir TXT, PDF veya Word dosyası seçin.');
    } finally {
      setImporting(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening');

  const dotColors = ['bg-teal-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400', 'bg-cyan-400', 'bg-emerald-400'];

  return (
    <div className="sf-page min-h-screen flex flex-col font-sans pb-28 bg-[#0f0f14] text-white">

      {/* Background glows */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-40 -left-10 w-56 h-56 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        {/* Menu (left) */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border-white/10`}
          >
            <span className="material-symbols-outlined text-[18px]">menu</span>
          </button>
        </div>

        {/* Centered Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-teal-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
          </div>
          <span className="font-black text-[18px] tracking-tight text-white">Tele<span className="text-teal-400">Promt</span></span>
        </div>

        {/* Language Picker (right) */}
        <button
          onClick={() => setShowLangPicker(p => !p)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/10 active:scale-95"
          title={t('language')}
        >
          <span className="text-[16px] leading-none">{LANGUAGES.find(l => l.code === lang)?.flag || '🌐'}</span>
          <span className="font-bold text-[11px] tracking-widest">{lang.toUpperCase()}</span>
          <span className="material-symbols-outlined text-[14px] text-white/40">expand_more</span>
        </button>
      </div>

      {/* Language Picker Overlay — fixed, her zaman görünür */}
      {showLangPicker && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLangPicker(false)}
          />
          {/* Panel */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-[340px]"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #12121a 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400 text-[18px]">language</span>
                <span className="font-black text-[15px] text-white tracking-tight">{t('language')}</span>
                <span className="text-[11px] text-white/30 font-bold ml-1">({LANGUAGES.length})</span>
              </div>
              <button onClick={() => setShowLangPicker(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors">
                <span className="material-symbols-outlined text-[16px] text-white/50">close</span>
              </button>
            </div>
            {/* Language Grid — 2 columns */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {LANGUAGES.map(lng => (
                <button
                  key={lng.code}
                  onClick={() => { setLanguage(lng.code); setShowLangPicker(false); }}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl text-left transition-all active:scale-95 ${
                    lang === lng.code
                      ? 'bg-teal-500/20 border border-teal-500/30'
                      : 'hover:bg-white/8 border border-white/5'
                  }`}
                >
                  <span className="text-[22px] leading-none shrink-0">{lng.flag}</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-bold text-[12px] truncate ${lang === lng.code ? 'text-teal-400' : 'text-white'}`}>{lng.label}</span>
                    <span className="text-[10px] text-white/30 font-bold tracking-widest">{lng.code.toUpperCase()}</span>
                  </div>
                  {lang === lng.code && (
                    <span className="material-symbols-outlined text-[14px] text-teal-400 ml-auto shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── GREETING ── */}
      <div className="relative z-10 px-5 mb-5">
        <p className="text-white/40 text-[13px]">{greeting} 👋</p>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="relative z-10 px-5 mb-5">
        <div className="grid grid-cols-3 gap-2">
          {/* Metin Yaz */}
          <button
            onClick={handleCreateNew}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-teal-500/30 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.25), rgba(8,145,178,0.10))' }}
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            </div>
            <span className="text-teal-400 font-bold text-[10px] text-center leading-tight">{t('newScript').split(' ').map((w,i)=><React.Fragment key={i}>{w}<br/></React.Fragment>)}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-white/10 bg-white/5 active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/60 text-[18px]">{importing ? 'hourglass_empty' : 'upload_file'}</span>
            </div>
            <span className="text-white/50 font-bold text-[10px] text-center leading-tight">{importing ? t('loading') : t('importText').split(' ').map((w,i)=><React.Fragment key={i}>{w}<br/></React.Fragment>)}</span>
          </button>
          <input type="file" accept=".txt,.pdf,.doc,.docx" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          {/* Kayıtlarım */}
          <button
            onClick={() => navigate('/recordings')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-indigo-500/30 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(139,92,246,0.10))' }}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
            </div>
            <span className="text-indigo-400 font-bold text-[10px] text-center leading-tight">{t('myVideos').split(' ').map((w,i)=><React.Fragment key={i}>{w}<br/></React.Fragment>)}</span>
          </button>
        </div>
      </div>

      {/* ── RECORD ACTION BUTTONS ── */}
      <div className="relative z-10 px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {/* Video Record */}
          <button
            onClick={() => navigate('/record')}
            className="flex items-center gap-2 p-3.5 rounded-2xl active:scale-[0.98] transition-transform relative shadow-lg keep-white"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
            <div className="flex-1 flex items-center justify-center pr-2">
              <p className="text-white font-black text-[14px] leading-none">{t('videoRecord')}</p>
            </div>
          </button>

          {/* Audio Record */}
          <button
            onClick={() => navigate('/record-audio')}
            className="flex items-center gap-2 p-3.5 rounded-2xl active:scale-[0.98] transition-transform relative shadow-lg keep-white"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
            </div>
            <div className="flex-1 flex items-center justify-center pr-2">
              <p className="text-white font-black text-[14px] leading-none">{t('audioRecord')}</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── SCRIPTS BOX (2-column grid inside container) ── */}
      <div className="relative z-10 px-5 mb-5">
        <div className="rounded-3xl border border-white/8 bg-white/4 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {/* Header inside box */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-[18px]">description</span>
              <span className="text-white font-bold text-[14px]">{t('scripts')}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/20">
              <span className="text-teal-400 text-[12px] font-bold">{scripts.length} {t('scriptsReady')}</span>
            </div>
          </div>

          {scripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="material-symbols-outlined text-[40px] text-white/15 mb-3">description</span>
              <p className="text-white/30 text-[13px]">{t('noScripts') || 'Henüz metin yok'}</p>
              <p className="text-white/20 text-[11px] mt-1">{t('createBelow')}</p>
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto pr-1 -mr-1" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-2 gap-2 pb-2">
                {scripts.map((script, idx) => {
                  const dot = dotColors[idx % dotColors.length];
                  const words = wordCount(script.content);
                  const preview = script.content.slice(0, 55).trim();

                  return (
                    <div
                      key={script.id}
                      onClick={() => handleOpenScript(script.id)}
                      className="relative flex flex-col h-full min-h-[110px] p-3 rounded-2xl bg-white/5 border border-white/8 active:scale-[0.97] transition-all duration-150 cursor-pointer overflow-hidden"
                    >
                      {/* Colored top line */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 ${dot} opacity-70 rounded-t-2xl`} />

                      <h3 className="font-bold text-[13px] text-white leading-tight truncate mt-1 mb-1">{script.title}</h3>
                      <p className="text-white/35 text-[10px] leading-snug line-clamp-2 mb-auto break-words">{preview}{script.content.length > 55 ? '…' : ''}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-white/30 text-[9px] font-medium tracking-wide truncate">{words} {t('wordCountUpper')}</span>
                          <span className="text-teal-400/70 text-[9px] font-bold truncate">{estimatedReadTime(script.content)}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRecord(script.id); }}
                            className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 active:scale-90 shrink-0"
                          >
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingId(script.id); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-rose-400 active:scale-90 shrink-0"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Delete Confirm Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm bg-[#1a1a24] rounded-3xl p-6 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-rose-400 text-[24px]">delete</span>
            </div>
            <h3 className="text-white font-bold text-[17px] mb-1">{t('deleteScriptMsg') || 'Bu metni sil?'}</h3>
            <p className="text-white/40 text-[13px] mb-6">{t('cannotUndo') || 'Bu işlem geri alınamaz.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold text-[14px] active:scale-95 transition-transform">
                {t('cancel') || 'Vazgeç'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (deleteScript) deleteScript(deletingId); setDeletingId(null); }}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-[14px] active:scale-95 transition-transform"
              >
                {t('delete') || 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Component */}
      <MobileMenu show={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
