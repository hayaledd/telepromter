import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    appName: 'ScriptFlow',
    myScripts: 'My Scripts',
    createNew: 'Create New Script',
    importTxt: 'Import .TXT File',
    scripts: 'Scripts',
    editor: 'Editor',
    record: 'Record',
    settings: 'Settings',
    filter: 'Filter',
    favorites: 'Favorites',
    recentRecordings: 'Recent Recordings',
    cloudSync: 'Cloud Sync',
    helpSupport: 'Help & Support',
    editScript: 'Edit Script',
    startRecording: 'Start Recording',
    titlePlaceholder: 'Script Title',
    contentPlaceholder: 'Start typing your script here...',
    wordCount: 'words',
    start: 'Start',
    stop: 'Stop',
    filters: 'Filters',
    layouts: 'Layouts',
    textSize: 'Text Size',
    close: 'Close',
    reviewRecording: 'Review Recording',
    discardRetake: 'Discard & Retake',
    saveVideo: 'Save Video',
    cameraFilters: 'Camera Filters',
    language: 'Language',
    untitledScript: 'Untitled Script',
  },
  tr: {
    appName: 'ScriptFlow',
    myScripts: 'Metinlerim',
    createNew: 'Yeni Metin Oluştur',
    importTxt: '.TXT Dosyası İçe Aktar',
    scripts: 'Metinler',
    editor: 'Düzenle',
    record: 'Kayıt',
    settings: 'Ayarlar',
    filter: 'Filtre',
    favorites: 'Favoriler',
    recentRecordings: 'Son Kayıtlar',
    cloudSync: 'Bulut Senkron',
    helpSupport: 'Yardım & Destek',
    editScript: 'Metni Düzenle',
    startRecording: 'Kaydı Başlat',
    titlePlaceholder: 'Metin Başlığı',
    contentPlaceholder: 'Metninizi buraya yazmaya başlayın...',
    wordCount: 'kelime',
    start: 'Başlat',
    stop: 'Durdur',
    filters: 'Filtreler',
    layouts: 'Düzen',
    textSize: 'Yazı Boyutu',
    close: 'Kapat',
    reviewRecording: 'Kaydı İncele',
    discardRetake: 'Sil & Tekrar Çek',
    saveVideo: 'Videoyu Kaydet',
    cameraFilters: 'Kamera Filtreleri',
    language: 'Dil',
    untitledScript: 'İsimsiz Metin',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('sf_lang') || 'tr');

  const toggleLang = () => {
    const newLang = lang === 'tr' ? 'en' : 'tr';
    setLang(newLang);
    localStorage.setItem('sf_lang', newLang);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
