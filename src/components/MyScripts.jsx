import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { useLanguage } from '../context/LanguageContext';

export default function MyScripts() {
  const navigate = useNavigate();
  const { scripts, setActiveScriptId, createNewScript, importScript, deleteScript } = useScript();
  const { t, lang, toggleLang } = useLanguage();
  const fileInputRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleOpenScript = (id) => {
    setActiveScriptId(id);
    navigate('/editor');
  };

  const handleCreateNew = () => {
    createNewScript();
    navigate('/editor');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const title = file.name.replace(/\.[^/.]+$/, ""); // remove extension
      importScript(title, content);
      navigate('/editor');
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col pt-control-bar-height pb-control-bar-height md:pb-0 dark">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-4 h-control-bar-height bg-surface-container-lowest dark:bg-surface-container-lowest justify-between md:hidden">
        <button onClick={() => setShowMenu(true)} className="text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-variant/50 transition-colors active:scale-95 duration-100 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim">{t('appName')}</h1>
        <button onClick={toggleLang} className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors active:scale-95 duration-100 px-3 py-1.5 rounded-full text-[12px] font-bold border border-outline-variant">
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>
      </header>

      {/* NavigationDrawer (Web) */}
      <nav className="hidden md:flex fixed inset-y-0 left-0 z-[60] flex-col py-6 h-full w-80 rounded-r-xl bg-surface dark:bg-surface border-r border-outline-variant shadow-lg">
        <div className="px-6 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim">Pro Speaker</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Professional Plan</p>
          </div>
        </div>
        <div className="flex-1 px-2 flex flex-col gap-2">
          <a className="flex items-center gap-4 bg-secondary-container text-on-secondary-container font-bold rounded-full mx-2 px-4 py-3" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
            <span className="font-body-md text-body-md">All Scripts</span>
          </a>
          <a className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all rounded-full px-4 py-3 mx-2 active:translate-x-1 duration-200" href="#">
            <span className="material-symbols-outlined">star</span>
            <span className="font-body-md text-body-md">Favorites</span>
          </a>
          <button onClick={() => navigate('/recordings')} className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all rounded-full px-4 py-3 mx-2 active:translate-x-1 duration-200">
            <span className="material-symbols-outlined">history</span>
            <span className="font-body-md text-body-md">Recent Recordings</span>
          </button>
          <a className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all rounded-full px-4 py-3 mx-2 active:translate-x-1 duration-200" href="#">
            <span className="material-symbols-outlined">cloud_upload</span>
            <span className="font-body-md text-body-md">Cloud Sync</span>
          </a>
        </div>
        <div className="mt-auto px-2">
          <a className="flex items-center gap-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all rounded-full px-4 py-3 mx-2 active:translate-x-1 duration-200" href="#">
            <span className="material-symbols-outlined">help_outline</span>
            <span className="font-body-md text-body-md">Help &amp; Support</span>
          </a>
          <p className="text-center font-label-caps text-label-caps text-on-surface-variant mt-4">v2.4.0</p>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-edge-margin-mobile md:px-edge-margin-tablet py-8 md:pl-[352px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-prompter-display text-prompter-display text-on-surface">{t('myScripts')}</h2>
          <div className="hidden md:flex gap-4">
            <button className="bg-surface-container-high hover:bg-surface-variant text-on-surface px-4 py-2 rounded-full flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
              <span className="font-body-md text-body-md">Filter</span>
            </button>
          </div>
        </div>

        {/* Scripts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map(script => (
            <div key={script.id} onClick={() => handleOpenScript(script.id)} className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors group cursor-pointer border border-transparent hover:border-outline-variant flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-on-surface-variant hover:text-on-surface bg-surface-variant/80 rounded-full p-2 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex items-start justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface pr-8 line-clamp-2">{script.title}</h3>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3 flex-1">
                {script.content}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/30">
                <div className="flex items-center gap-2 text-tertiary">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="font-label-caps text-label-caps">{script.duration}</span>
                </div>
                <span className="font-label-caps text-label-caps text-on-surface-variant">{script.date}</span>
              </div>
            </div>
          ))}

          {/* New Script Placeholder / Action Card */}
          <div onClick={handleCreateNew} className="bg-surface-container/50 border-2 border-dashed border-outline-variant rounded-xl p-6 hover:bg-surface-container transition-colors group cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[200px]">
            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <span className="font-headline-md text-headline-md text-primary">{t('createNew')}</span>
          </div>

          {/* Import Script Card */}
          <div onClick={() => fileInputRef.current?.click()} className="bg-surface-container/50 border-2 border-dashed border-outline-variant rounded-xl p-6 hover:bg-surface-container transition-colors group cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[200px]">
            <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">upload_file</span>
            </div>
            <span className="font-headline-md text-headline-md text-secondary">{t('importTxt')}</span>
            <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
        </div>
      </main>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={handleCreateNew}
        className="md:hidden fixed bottom-[calc(72px+24px)] right-6 w-14 h-14 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>


      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-edge-margin-mobile py-2 bg-surface-container dark:bg-surface-container-high border-t border-outline-variant pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        {/* Active: Scripts */}
        <button className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1 active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="font-label-caps text-label-caps mt-1">{t('scripts')}</span>
        </button>
        {/* Inactive: Editor */}
        <button onClick={() => navigate('/editor')} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant dark:hover:bg-surface-bright rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined">edit_note</span>
          <span className="font-label-caps text-label-caps mt-1">{t('editor')}</span>
        </button>
        {/* Inactive: Record */}
        <button onClick={() => navigate('/record')} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant dark:hover:bg-surface-bright rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined">videocam</span>
          <span className="font-label-caps text-label-caps mt-1">{t('record')}</span>
        </button>
        {/* Inactive: Settings */}
        <button onClick={() => setShowMenu(true)} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant dark:hover:bg-surface-bright rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-caps text-label-caps mt-1">{t('settings')}</span>
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
          <div className="relative z-10 w-72 h-full bg-surface-container-lowest border-r border-outline-variant flex flex-col py-8 px-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container">movie</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-[16px]">ScriptFlow</p>
                <p className="text-on-surface-variant text-[12px]">v2.4.0</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <button onClick={() => setShowMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-container text-on-primary-container font-bold">
                <span className="material-symbols-outlined">description</span>
                <span>{t('myScripts')}</span>
              </button>
              <button onClick={() => { handleCreateNew(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">add_circle</span>
                <span>{t('createNew')}</span>
              </button>
              <button onClick={() => navigate('/recordings')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">video_library</span>
                <span>Videolarım</span>
              </button>
              <button onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">upload_file</span>
                <span>{t('importTxt')}</span>
              </button>
            </div>
            <button onClick={toggleLang} className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors border border-outline-variant">
              <span className="material-symbols-outlined">language</span>
              <span>{lang === 'tr' ? 'Switch to English' : "Türkçe'ye Geç"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
