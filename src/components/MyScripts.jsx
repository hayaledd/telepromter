import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';

// Her script kartı için renk paleti (döngüsel)
const CARD_ACCENTS = [
  { gradient: 'from-violet-500/20 to-indigo-500/10', dot: 'bg-violet-400', text: 'text-violet-300', border: 'border-violet-500/20' },
  { gradient: 'from-cyan-500/20 to-blue-500/10',    dot: 'bg-cyan-400',   text: 'text-cyan-300',   border: 'border-cyan-500/20' },
  { gradient: 'from-rose-500/20 to-pink-500/10',    dot: 'bg-rose-400',   text: 'text-rose-300',   border: 'border-rose-500/20' },
  { gradient: 'from-amber-500/20 to-orange-500/10', dot: 'bg-amber-400',  text: 'text-amber-300',  border: 'border-amber-500/20' },
  { gradient: 'from-emerald-500/20 to-teal-500/10', dot: 'bg-emerald-400',text: 'text-emerald-300',border: 'border-emerald-500/20' },
  { gradient: 'from-fuchsia-500/20 to-purple-500/10',dot: 'bg-fuchsia-400',text: 'text-fuchsia-300',border: 'border-fuchsia-500/20' },
];

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function MyScripts() {
  const navigate = useNavigate();
  const { scripts, setActiveScriptId, createNewScript, importScript, deleteScript } = useScript();
  const { t, lang, toggleLang } = useLanguage();
  const fileInputRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleOpenScript = (id) => {
    setActiveScriptId(id);
    navigate('/editor');
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
      const content = event.target.result;
      const title = file.name.replace(/\.[^/.]+$/, '');
      importScript(title, content);
      navigate('/editor');
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    if (deleteScript) deleteScript(deletingId);
    setDeletingId(null);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening');

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col pt-control-bar-height pb-control-bar-height md:pb-0 dark">

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-4 h-control-bar-height bg-surface-container-lowest/80 backdrop-blur-xl border-b border-white/5 justify-between md:hidden">
        <button onClick={() => setShowMenu(true)} className="text-on-surface-variant hover:bg-white/10 transition-colors active:scale-95 duration-100 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
          <h1 className="font-bold text-[18px] tracking-tight text-white">Tele<span className="text-primary">Promt</span></h1>
        </div>
        <button onClick={toggleLang} className="text-on-surface-variant hover:bg-white/10 transition-colors active:scale-95 duration-100 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/10">
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 md:pl-[352px]">

        {/* Karşılama & Özet */}
        <div className="mb-8">
          <p className="text-on-surface-variant text-[13px] font-medium mb-1">{greeting} 👋</p>
          <h2 className="text-[26px] font-black text-white tracking-tight leading-tight">
            {t('myScripts')}
          </h2>
          <p className="text-on-surface-variant text-[13px] mt-1">
            {scripts.length} {t('scriptsCount')}
          </p>
        </div>

        {/* Aksiyon Butonları (Üste alındı) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {/* Yeni Metin */}
          <button
            onClick={handleCreateNew}
            className="relative group flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </div>
            <span className="text-primary font-bold text-[13px]">{t('newScript')}</span>
          </button>

          {/* .txt İçe Aktar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-on-surface-variant text-[26px]">upload_file</span>
            </div>
            <span className="text-on-surface-variant font-bold text-[13px]">{t('importText')}</span>
            <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </button>
        </div>

        {/* Scripts Listesi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {scripts.map((script, idx) => {
            const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
            const words = wordCount(script.content);
            const preview = script.content.slice(0, 90).trim();

            return (
              <div
                key={script.id}
                onClick={() => handleOpenScript(script.id)}
                className={`relative group cursor-pointer rounded-2xl border ${accent.border} bg-gradient-to-br ${accent.gradient} backdrop-blur-sm overflow-hidden active:scale-[0.98] transition-all duration-150`}
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
              >
                {/* Accent şerit (sol) */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.dot} opacity-80 rounded-l-2xl`} />

                <div className="pl-5 pr-4 pt-4 pb-4 flex flex-col gap-2">
                  {/* Üst satır: başlık + aksiyon */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[15px] text-white leading-tight flex-1 line-clamp-1">
                      {script.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Düzenle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenScript(script.id); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        title="Düzenle"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      {/* Kayıt ekranına git */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveScriptId(script.id); navigate('/record'); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${accent.text} hover:bg-white/10 transition-colors`}
                        title="Kayda Başla"
                      >
                        <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                      </button>
                      {/* Sil */}
                      <button
                        onClick={(e) => handleDelete(e, script.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Sil"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Önizleme */}
                  <p className="text-white/50 text-[12px] leading-relaxed line-clamp-2">
                    {preview}{script.content.length > 90 ? '…' : ''}
                  </p>

                  {/* Alt meta */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${accent.text} flex items-center gap-1`}>
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {script.duration}
                    </span>
                    <span className="text-white/30 text-[10px]">·</span>
                    <span className="text-white/40 text-[10px]">{words} {t('wordCount')}</span>
                    <span className="text-white/30 text-[10px]">·</span>
                    <span className="text-white/40 text-[10px]">{script.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Boşsa mesaj */}
        {scripts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[64px] text-white/10 mb-4">description</span>
            <p className="text-white/40 text-[15px] font-medium">{t('noScripts')}</p>
            <p className="text-white/25 text-[13px] mt-1">{t('createBelow')}</p>
          </div>
        )}

        {/* Aksiyon butonları buradaydı, üste taşındı. */}

      </main>

      {/* FAB */}
      <button
        onClick={handleCreateNew}
        className="md:hidden fixed bottom-[calc(72px+20px)] right-5 w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-[0_4px_24px_rgba(173,198,255,0.35)] active:scale-95 transition-all duration-150 z-40"
      >
        <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      {/* Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-white/5 h-[64px]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <button className="flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-xl bg-primary/15">
          <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="text-[10px] font-bold text-primary">{t('scripts')}</span>
        </button>
        <button onClick={() => navigate('/editor')} className="flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-xl text-white/40 hover:text-white/70 transition-colors">
          <span className="material-symbols-outlined text-[22px]">edit_note</span>
          <span className="text-[10px] font-medium">{t('editor')}</span>
        </button>
        <button onClick={() => navigate('/record')} className="flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-xl text-white/40 hover:text-white/70 transition-colors">
          <span className="material-symbols-outlined text-[22px]">videocam</span>
          <span className="text-[10px] font-medium">{t('record')}</span>
        </button>
        <button onClick={() => setShowMenu(true)} className="flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-xl text-white/40 hover:text-white/70 transition-colors">
          <span className="material-symbols-outlined text-[22px]">menu</span>
          <span className="text-[10px] font-medium">{t('menu')}</span>
        </button>
      </nav>

      {/* Silme Onay Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDeletingId(null)}>
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-rose-400 text-[24px]">delete</span>
            </div>
            <h3 className="text-white font-bold text-[17px] mb-1">{t('deleteScriptMsg')}</h3>
            <p className="text-white/50 text-[13px] mb-6">{t('cannotUndo')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold text-[14px] active:scale-95 transition-transform"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-[14px] active:scale-95 transition-transform"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
          <div className="relative z-10 w-72 h-full bg-surface-container-lowest border-r border-white/5 flex flex-col py-8 px-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>video_camera_front</span>
              </div>
              <div>
                <p className="font-bold text-white text-[16px]">ScriptFlow</p>
                <p className="text-white/40 text-[12px]">v2.4.0</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <button onClick={() => setShowMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/15 text-primary font-bold">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                <span>{t('myScripts')}</span>
              </button>
              <button onClick={() => { handleCreateNew(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined">add_circle</span>
                <span>{t('createNew')}</span>
              </button>
              <button onClick={() => { navigate('/recordings'); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined">video_library</span>
                <span>Videolarım</span>
              </button>
              <button onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined">upload_file</span>
                <span>{t('importTxt')}</span>
              </button>
            </div>
            <button onClick={toggleLang} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 transition-colors border border-white/10">
              <span className="material-symbols-outlined">language</span>
              <span>{lang === 'tr' ? 'Switch to English' : "Türkçe'ye Geç"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
