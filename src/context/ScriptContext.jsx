import React, { createContext, useState, useContext, useEffect } from 'react';

const ScriptContext = createContext();

export const useScript = () => useContext(ScriptContext);

const DEFAULT_SCRIPTS = [
  {
    id: '1',
    title: 'Q3 Earnings Call Presentation',
    content: "Good morning everyone and thank you for joining us today.\n\nI'm excited to share our third-quarter results, which reflect strong execution across our strategic priorities.\n\nWe've seen significant growth in our core enterprise segment.",
    date: 'Oct 24, 2023',
    duration: '12 MIN'
  },
  {
    id: '2',
    title: 'Product Launch: Vision Pro',
    content: "Welcome to the future of spatial computing.\n\nToday, we are not just launching a new product; we are introducing a new paradigm in how we interact with technology.\n\nThe Vision Pro blends the physical and digital worlds seamlessly.",
    date: 'Oct 20, 2023',
    duration: '8 MIN'
  },
  {
    id: '3',
    title: 'Keynote: AI in Modern Enterprise',
    content: "The rapid acceleration of artificial intelligence is no longer a future concept—it is our current reality.\n\nAs leaders, we must adapt our strategies to integrate these intelligent systems ethically and effectively.",
    date: 'Oct 15, 2023',
    duration: '45 MIN'
  }
];

export const ScriptProvider = ({ children }) => {
  const [scripts, setScripts] = useState(() => {
    const saved = localStorage.getItem('scriptflow_scripts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch(e) {
        return DEFAULT_SCRIPTS;
      }
    }
    return DEFAULT_SCRIPTS;
  });
  
  const [activeScriptId, setActiveScriptId] = useState(null);

  const [globalFontSize, setGlobalFontSize] = useState(() => {
    return parseInt(localStorage.getItem('scriptflow_fontsize') || '32');
  });

  useEffect(() => {
    localStorage.setItem('scriptflow_scripts', JSON.stringify(scripts));
  }, [scripts]);

  useEffect(() => {
    localStorage.setItem('scriptflow_fontsize', globalFontSize.toString());
  }, [globalFontSize]);

  const getActiveScript = () => {
    return scripts.find(s => s.id === activeScriptId) || null;
  };

  const updateActiveScript = (updates) => {
    setScripts(prev => prev.map(s => s.id === activeScriptId ? { ...s, ...updates } : s));
  };

  const createNewScript = () => {
    const newId = Date.now().toString();
    const newScript = {
      id: newId,
      title: 'Untitled Script',
      content: 'Start typing your new script here...',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration: '1 MIN'
    };
    setScripts(prev => [newScript, ...prev]);
    setActiveScriptId(newId);
  };

  const importScript = (title, content) => {
    const newId = Date.now().toString();
    const newScript = {
      id: newId,
      title: title || 'Imported Script',
      content: content || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration: '1 MIN'
    };
    setScripts(prev => [newScript, ...prev]);
    setActiveScriptId(newId);
  };

  const deleteScript = (id) => {
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  return (
    <ScriptContext.Provider value={{
      scripts,
      activeScriptId,
      setActiveScriptId,
      getActiveScript,
      updateActiveScript,
      createNewScript,
      importScript,
      deleteScript,
      globalFontSize,
      setGlobalFontSize
    }}>
      {children}
    </ScriptContext.Provider>
  );
};
