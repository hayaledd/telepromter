import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function MyScripts() {
  const navigate = useNavigate();
  const { scripts, setActiveScriptId, createNewScript, importScript, deleteScript } = useScript();
  const { t, lang, toggleLang } = useLanguage();
  const fileInputRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleOpenScript = (id) => {
    setActiveScriptId(id);
    navigate('/editor');
  };

  const handleRecord = (id) => {
    setActiveScriptId(id);
    navigate('/record');
  };

  const handleCreateNew = () => {
    createNewScript(t('untitledScript'), t('contentPlaceholder'));
    navigate('/editor');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importScript(file.name.replace(/\.[^/.]+$/, ''), event.target.result);
      navigate('/editor');
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi Günler' : 'İyi Akşamlar';

  const dotColors = ['bg-teal-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400', 'bg-cyan-400', 'bg-emerald-400'];

  return (
    <div className="bg-[#0f0f14] text-white min-h-screen flex flex-col font-sans pb-28">

      {/* Background glows */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-40 -left-10 w-56 h-56 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        {/* Lang button (left) */}
        <button
          onClick={toggleLang}
          className="text-white/40 hover:text-white/70 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/10 transition-colors"
        >
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>

        {/* Centered Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-teal-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
          </div>
          <span className="font-black text-[18px] tracking-tight text-white">Tele<span className="text-teal-400">Promt</span></span>
        </div>

        {/* Recordings button (right) */}
        <button
          onClick={() => navigate('/recordings')}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
        >
          <span className="material-symbols-outlined text-[18px]">video_library</span>
        </button>
      </div>

      {/* ── GREETING ── */}
      <div className="relative z-10 px-5 mb-5">
        <p className="text-white/40 text-[13px]">{greeting} 👋</p>
      </div>

      {/* ── RECORD BANNER ── */}
      <div className="relative z-10 px-5 mb-5">
        <button
          onClick={() => navigate('/record')}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}
        >
          <div>
            <p className="text-white/70 text-[11px] font-semibold uppercase tracking-widest mb-0.5">Hızlı Başlat</p>
            <p className="text-white font-black text-[18px]">Hemen Kayıt Yap</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
            <span className="material-symbols-outlined text-white/80 text-[20px]">arrow_forward_ios</span>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
        </button>
      </div>

      {/* ── SCRIPTS BOX (2-column grid inside container) ── */}
      <div className="relative z-10 px-5 mb-5">
        <div className="rounded-3xl border border-white/8 bg-white/4 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {/* Header inside box */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-[18px]">description</span>
              <span className="text-white font-bold text-[14px]">Metinler</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/20">
              <span className="text-teal-400 text-[12px] font-bold">{scripts.length} metin hazır</span>
            </div>
          </div>

          {scripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="material-symbols-outlined text-[40px] text-white/15 mb-3">description</span>
              <p className="text-white/30 text-[13px]">{t('noScripts') || 'Henüz metin yok'}</p>
              <p className="text-white/20 text-[11px] mt-1">Aşağıdan yeni bir metin oluşturun</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {scripts.map((script, idx) => {
                const dot = dotColors[idx % dotColors.length];
                const words = wordCount(script.content);
                const preview = script.content.slice(0, 55).trim();

                return (
                  <div
                    key={script.id}
                    onClick={() => handleOpenScript(script.id)}
                    className="relative flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/8 active:scale-[0.97] transition-all duration-150 cursor-pointer overflow-hidden"
                  >
                    {/* Colored top line */}
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${dot} opacity-70 rounded-t-2xl`} />

                    <h3 className="font-bold text-[13px] text-white leading-tight line-clamp-1 mt-1">{script.title}</h3>
                    <p className="text-white/35 text-[10px] leading-relaxed line-clamp-2">{preview}{script.content.length > 55 ? '…' : ''}</p>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-white/25 text-[10px]">{words} kelime</span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRecord(script.id); }}
                          className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingId(script.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-rose-400 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM QUICK ACTIONS (fixed) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-4 bg-gradient-to-t from-[#0f0f14] via-[#0f0f14]/95 to-transparent">
        <div className="grid grid-cols-4 gap-2">
          {/* Metin Yaz */}
          <button
            onClick={handleCreateNew}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-teal-500/30 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.25), rgba(8,145,178,0.10))' }}
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            </div>
            <span className="text-teal-400 font-bold text-[10px] text-center leading-tight">Metin<br/>Yaz</span>
          </button>

          {/* İçe Aktar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-white/10 bg-white/5 active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/60 text-[18px]">upload_file</span>
            </div>
            <span className="text-white/50 font-bold text-[10px] text-center leading-tight">İçe<br/>Aktar</span>
          </button>
          <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          {/* Kayıtlarım */}
          <button
            onClick={() => navigate('/recordings')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-indigo-500/30 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(139,92,246,0.10))' }}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
            </div>
            <span className="text-indigo-400 font-bold text-[10px] text-center leading-tight">Kayıt-<br/>larım</span>
          </button>

          {/* Metinler */}
          <button
            onClick={() => {}}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-violet-500/30 bg-violet-500/15 active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-violet-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <span className="text-violet-400 font-bold text-[10px] text-center leading-tight">Metin-<br/>ler</span>
          </button>
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
    </div>
  );
}
