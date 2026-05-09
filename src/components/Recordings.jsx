import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
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
          rawUri: stat.uri,
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
    if (window.confirm(t('deleteVideoMsg'))) {
      try {
        await Filesystem.deleteFile({
          path: name,
          directory: Directory.Documents
        });
        loadVideos();
      } catch (e) {
        alert(t('deleteError') + e);
      }
    }
  };

  const shareVideo = async (video) => {
    try {
      await Share.share({
        title: video.name,
        text: t('recordedWith'),
        url: video.rawUri,
        dialogTitle: t('shareVideoTitle')
      });
    } catch (e) {
      console.error(t('shareError'), e);
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
          <h1 className="font-headline-md text-headline-md text-on-surface">{t('myVideos')}</h1>
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
            <p>{t('noVideosDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {videos.map((video, idx) => (
              <VideoCard
                key={idx}
                video={video}
                onShare={shareVideo}
                onDelete={deleteVideo}
              />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

// —— Video Thumbnail Kartı ——
function VideoCard({ video, onShare, onDelete }) {
  const { t } = useLanguage();
  const [thumbnail, setThumbnail] = React.useState(null);
  const [playerOpen, setPlayerOpen] = React.useState(false);

  React.useEffect(() => {
    generateThumbnail(video.url).then(setThumbnail);
  }, [video.url]);

  return (
    <>
      <div className="bg-surface-container rounded-2xl overflow-hidden border border-white/5 shadow-md flex flex-col group">
        {/* Thumbnail alanı */}
        <button
          onClick={() => setPlayerOpen(true)}
          className="relative aspect-[9/16] bg-black w-full overflow-hidden focus:outline-none"
          aria-label={t('playVideo')}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt="video thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant opacity-40">movie</span>
            </div>
          )}
          {/* Play overlay butonu */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 active:bg-black/40 transition-colors">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              <span className="material-symbols-outlined text-[32px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </div>
          </div>
          {/* Boyut rozeti */}
          <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-2 py-0.5">
            <span className="text-[10px] text-white font-mono">{video.size}</span>
          </div>
        </button>

        {/* Alt bilgi */}
        <div className="p-3 flex flex-col gap-1">
          <h3 className="font-bold text-[12px] text-on-surface truncate" title={video.name}>
            {video.name.replace('ScriptFlow_Recording_', t('recordingPrefix'))}
          </h3>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-on-surface-variant">{video.date}</p>
            <div className="flex gap-1">
              <button 
                onClick={() => onShare(video)}
                className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"
                title={t('share')}
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
              </button>
              <button 
                onClick={() => onDelete(video.name)}
                className="text-error hover:bg-error/10 p-1 rounded-full transition-colors"
                title={t('delete')}
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tam ekran oynatıcı modal */}
      {playerOpen && (
        <VideoPlayerModal video={video} onClose={() => setPlayerOpen(false)} />
      )}
    </>
  );
}

// —— Thumbnail üretici (canvas) ——
function generateThumbnail(src) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 568;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = src;
    video.load();
  });
}

// —— Tam Ekran Video Oynatıcı Modal ——
function VideoPlayerModal({ video, onClose }) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      {/* Kapat butonu */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20"
        aria-label={t('close')}
      >
        <span className="material-symbols-outlined text-white text-[22px]">close</span>
      </button>

      {/* Video adı ve tarihi */}
      <div className="absolute top-4 left-4 right-16 z-10">
        <p className="text-white text-[12px] font-medium truncate opacity-80">
          {video.name.replace('ScriptFlow_Recording_', t('recordingPrefix'))}
        </p>
        <p className="text-white/50 text-[10px]">{video.date}</p>
      </div>

      {/* Video oynatıcı */}
      <video
        src={video.url}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        style={{ maxHeight: '100dvh' }}
      />
    </div>
  );
}
