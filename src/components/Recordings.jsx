import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../context/LanguageContext';

export default function Recordings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const result = await Filesystem.readdir({
        path: '',
        directory: Directory.Documents
      });

      // Filter webm and mp4 files created by the app
      const videoFiles = result.files.filter(f => 
        (f.name.startsWith('ScriptFlow_Recording_') || f.name.endsWith('.webm') || f.name.endsWith('.mp4')) && !f.type || f.type === 'file'
      );

      // Map to usable objects
      const formattedVideos = await Promise.all(videoFiles.map(async (file) => {
        // file.uri or we construct it
        const stat = await Filesystem.stat({
          path: file.name,
          directory: Directory.Documents
        });
        
        const videoUrl = Capacitor.convertFileSrc(stat.uri);
        
        // Convert timestamp from filename or stat to readable date
        const date = new Date(stat.ctime || stat.mtime || Date.now());
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        return {
          name: file.name,
          url: videoUrl,
          date: formattedDate,
          size: (stat.size / (1024 * 1024)).toFixed(2) + ' MB'
        };
      }));

      // Sort newest first
      formattedVideos.sort((a, b) => b.name.localeCompare(a.name));
      
      setVideos(formattedVideos);
    } catch (e) {
      console.error("Error loading videos", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (name) => {
    if (window.confirm("Bu videoyu silmek istediğinize emin misiniz?")) {
      try {
        await Filesystem.deleteFile({
          path: name,
          directory: Directory.Documents
        });
        loadVideos();
      } catch (e) {
        alert("Silinirken hata oluştu: " + e);
      }
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col dark">
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 flex items-center justify-between px-4 h-control-bar-height bg-surface-container-lowest border-b border-surface-container-low backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/scripts')}
            aria-label="Back" 
            className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-full p-2 active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-on-surface">Videolarım</h1>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="flex-grow p-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-[64px] mb-4">videocam_off</span>
            <p>Henüz kayıtlı video bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {videos.map((video, idx) => (
              <div key={idx} className="bg-surface-container rounded-2xl overflow-hidden border border-white/5 shadow-md flex flex-col group">
                <div className="relative aspect-[9/16] bg-black">
                  <video 
                    src={video.url} 
                    className="w-full h-full object-cover" 
                    controls 
                    preload="metadata"
                  ></video>
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <h3 className="font-bold text-[12px] text-on-surface truncate" title={video.name}>
                    {video.name.replace('ScriptFlow_Recording_', 'Kayıt ')}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[10px] text-on-surface-variant">{video.date}</p>
                    <button 
                      onClick={() => deleteVideo(video.name)}
                      className="text-error hover:bg-error/10 p-1 rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-mono">{video.size}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
