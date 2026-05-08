import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';

export default function ScriptEditor() {
  const navigate = useNavigate();
  const { getActiveScript, updateActiveScript, globalFontSize, setGlobalFontSize } = useScript();

  const script = getActiveScript();

  useEffect(() => {
    if (!script) {
      navigate('/scripts');
    }
  }, [script, navigate]);

  if (!script) return null;

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col overflow-hidden dark">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-control-bar-height bg-surface-container-lowest border-b border-surface-container-low">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/scripts')}
            aria-label="Back" 
            className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-full p-2 active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-on-surface">Edit Script</h1>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Settings" className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-full p-2 active:scale-95 duration-100 hidden md:block">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>more_vert</span>
          </button>
          <button 
            onClick={() => navigate('/record')}
            className="bg-primary text-on-primary font-headline-md text-body-md px-6 py-2 rounded-full hover:bg-primary-fixed transition-colors active:scale-95 duration-100 flex items-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            <span className="hidden md:inline">Start Recording</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Script Editor */}
      <main className="flex-grow pt-control-bar-height pb-[100px] flex flex-col md:px-edge-margin-tablet px-edge-margin-mobile max-w-4xl mx-auto w-full relative h-screen">
        {/* Script Title Input */}
        <input 
          className="w-full bg-transparent border-none text-headline-md font-headline-md text-on-surface focus:ring-0 focus:outline-none py-6 placeholder-on-surface-variant/50" 
          placeholder="Script Title" 
          type="text" 
          value={script.title}
          onChange={(e) => updateActiveScript({ title: e.target.value })}
        />
        {/* Script Text Area */}
        <textarea 
          className="flex-grow w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none font-prompter-standard text-on-surface placeholder-on-surface-variant/30 py-4" 
          placeholder="Start typing your script here..."
          value={script.content}
          onChange={(e) => updateActiveScript({ content: e.target.value })}
          style={{ fontSize: `${globalFontSize}px`, lineHeight: 1.4 }}
        />
      </main>

      {/* Floating Editor Toolbar */}
      <div className="fixed bottom-control-bar-height md:bottom-gutter left-1/2 transform -translate-x-1/2 w-[calc(100%-32px)] md:w-auto md:min-w-[400px] z-40">
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
          <div className="h-8 w-px bg-outline-variant/50"></div>
          {/* Scroll Speed Controls */}
          <div className="flex items-center gap-4 flex-grow md:flex-grow-0 md:w-48">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">speed</span>
            <input aria-label="Scroll Speed" className="w-full" max="10" min="1" type="range" defaultValue="5"/>
          </div>
        </div>
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-edge-margin-mobile py-2 bg-surface-container border-t border-surface-container-high md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        <button onClick={() => navigate('/scripts')} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>description</span>
          <span className="font-label-caps text-label-caps mt-1">Scripts</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1 active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
          <span className="font-label-caps text-label-caps mt-1">Editor</span>
        </button>
        <button onClick={() => navigate('/record')} className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>videocam</span>
          <span className="font-label-caps text-label-caps mt-1">Record</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-variant rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
          <span className="font-label-caps text-label-caps mt-1">Settings</span>
        </button>
      </nav>
    </div>
  );
}
