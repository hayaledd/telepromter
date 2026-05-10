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
  const [activeTab, setActiveTab] = useState('scripts'); // 'scripts' | 'add'

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

  return (
    <div className="bg-[#0f0f14] text-white min-h-screen flex flex-col font-sans">

      {/* Hero Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-6">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
            </div>
            <span className="font-black text-[17px] tracking-tight text-white">Tele<span className="text-teal-400">Promt</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="text-white/40 hover:text-white/70 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/10 transition-colors">
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
            <button onClick={() => navigate('/recordings')} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors border border-white/10">
              <span className="material-symbols-outlined text-[18px]">video_library</span>
            </button>
          </div>
        </div>

        {/* Greeting + Title */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white/40 text-[13px] mb-1">{greeting} 👋</p>
            <h1 className="text-[28px] font-black leading-tight tracking-tight text-white">
              {t('myScripts') || 'Metinlerim'}
            </h1>
            <p className="text-white/40 text-[13px] mt-1">{scripts.length} metin hazır</p>
          </div>
          {/* Decorative circle */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/30 to-indigo-500/20 border border-teal-400/20 flex items-center justify-center ml-4 shrink-0">
            <span className="material-symbols-outlined text-teal-400 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
          </div>
        </div>

        {/* Record Now Banner */}
        <button
          onClick={() => navigate('/record')}
          className="relative z-10 mt-5 w-full flex items-center justify-between px-5 py-4 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
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
          {/* Decorative blobs */}
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/5 rounded-full" />
        </button>
      </div>

      {/* Quick Action Cards */}
      <div className="px-5 mb-5">
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-3">Hızlı İşlemler</p>
        <div className="grid grid-cols-3 gap-3">
          {/* Write Script */}
          <button
            onClick={handleCreateNew}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-teal-500/30 active:scale-95 transition-all duration-150"
            style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.25) 0%, rgba(8,145,178,0.10) 100%)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            </div>
            <span className="text-teal-400 font-bold text-[11px] text-center leading-tight">Metin Yaz</span>
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/5 active:scale-95 transition-all duration-150"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/60 text-[20px]">upload_file</span>
            </div>
            <span className="text-white/50 font-bold text-[11px] text-center leading-tight">İçe Aktar</span>
          </button>
          <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          {/* Recordings */}
          <button
            onClick={() => navigate('/recordings')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-indigo-500/30 active:scale-95 transition-all duration-150"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(139,92,246,0.10) 100%)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
            </div>
            <span className="text-indigo-400 font-bold text-[11px] text-center leading-tight">Kayıtlarım</span>
          </button>
        </div>
      </div>

      {/* Script List */}
      <div className="flex-1 px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Metinler</p>
          <span className="text-white/20 text-[11px]">{scripts.length} adet</span>
        </div>

        {scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[36px] text-white/20">description</span>
            </div>
            <p className="text-white/30 text-[15px] font-medium">{t('noScripts') || 'Henüz metin yok'}</p>
            <p className="text-white/20 text-[13px] mt-1">Yukarıdan yeni bir metin oluşturun</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scripts.map((script, idx) => {
              const words = wordCount(script.content);
              const preview = script.content.slice(0, 80).trim();
              const dotColors = ['bg-teal-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400', 'bg-cyan-400', 'bg-emerald-400'];
              const dot = dotColors[idx % dotColors.length];

              return (
                <div
                  key={script.id}
                  className="relative group flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 border border-white/8 active:scale-[0.99] transition-all duration-150 cursor-pointer"
                  onClick={() => handleOpenScript(script.id)}
                >
                  {/* Colored dot */}
                  <div className={`w-2 h-2 rounded-full ${dot} shrink-0`} />

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[14px] text-white leading-tight truncate">{script.title}</h3>
                    <p className="text-white/35 text-[11px] mt-0.5 truncate">{preview}{script.content.length > 80 ? '…' : ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/25 text-[10px]">{words} kelime</span>
                      <span className="text-white/15">·</span>
                      <span className="text-white/25 text-[10px]">{script.duration}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Record */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRecord(script.id); }}
                      className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 hover:bg-teal-500/30 transition-colors active:scale-90"
                      title="Kayda Başla"
                    >
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(script.id); }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-colors active:scale-90"
                      title="Sil"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={handleCreateNew}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all z-40"
        style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}
      >
        <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

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
              <button onClick={(e) => { e.stopPropagation(); if (deleteScript) deleteScript(deletingId); setDeletingId(null); }} className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-[14px] active:scale-95 transition-transform">
                {t('delete') || 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
