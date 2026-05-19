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
        (f.name.startsWith('ScriptFlow_Recording_') || f.name.startsWith('TelePromt_Recording_') || f.name.endsWith('.webm') || f.name.endsWith('.mp4')) && (!f.type || f.type === 'file')
      );

      // Map to usable objects
      const formattedVideos = await Promise.all(videoFiles.map(async (file) => {
        const stat = await Filesystem.stat({
          path: file.name,
          directory: Directory.Documents
        });

        const videoUrl = Capacitor.convertFileSrc(stat.uri);
        const date = new Date(stat.ctime || stat.mtime || Date.now());
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

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

  // ── Günlük gruplama yardımcısı ──
  const groupByDay = (files) => {
    const groups = {};
    files.forEach(video => {
      // Dosya adından timestamp çıkar (örn: TelePromt_Recording_1716000000000.mp4)
      const tsMatch = video.name.match(/(\d{13})/);
      const date = tsMatch ? new Date(parseInt(tsMatch[1])) : new Date(video.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(video);
    });
    // En yeni gün önce
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const formatDayLabel = (key) => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (key === todayKey) return t('today') || 'Bugün';
    if (key === yKey) return t('yesterday') || 'Dün';
    const [y, m, d] = key.split('-');
    return `${d}.${m}.${y}`;
  };

  return (
    <div className="bg-[#0f0f14] text-white font-sans antialiased min-h-screen flex flex-col relative overflow-hidden pb-[100px]">

      {/* Background glow */}
      <div className="fixed top-20 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 -left-10 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* TopAppBar */}
      <header className="relative z-10 w-full flex items-center justify-between px-5 pt-12 pb-4 bg-white/5 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/scripts')}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <div>
            <h1 className="font-bold text-[18px] text-white tracking-tight">{t('myVideos')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/20">
            <span className="text-indigo-400 text-[12px] font-bold">{videos.length} kayıt</span>
          </div>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="relative z-10 flex-grow px-5 py-6 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[40px] text-white/20">videocam_off</span>
            </div>
            <p className="text-white/40 text-[14px]">{t('noVideosDesc') || 'Henüz kayıtlı video bulunmuyor.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groupByDay(videos).map(([dayKey, dayVideos]) => (
              <DayGroup
                key={dayKey}
                label={formatDayLabel(dayKey)}
                videos={dayVideos}
                onShare={shareVideo}
                onDelete={deleteVideo}
              />
            ))}
          </div>
        )}
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-gradient-to-t from-[#0f0f14] via-[#0f0f14]/95 to-transparent md:hidden">
        <button onClick={() => navigate('/scripts')} className="flex flex-col items-center justify-center text-white/40 p-2 hover:text-white active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[24px]">description</span>
        </button>
        <button onClick={() => navigate('/editor')} className="flex flex-col items-center justify-center text-white/40 p-2 hover:text-white active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>edit_note</span>
        </button>
        <button onClick={() => navigate('/record')} className="flex flex-col items-center justify-center text-white/40 p-2 hover:text-white active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[24px]">videocam</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-2xl px-6 py-2 border border-indigo-500/30 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
        </button>
      </nav>

    </div>
  );
}

// —— Günlük Klasör Bileşeni ——
function DayGroup({ label, videos, onShare, onDelete }) {
  const [collapsed, setCollapsed] = React.useState(true);
  const audioCount = videos.filter(v => v.name.includes('_Audio_') || v.name.endsWith('.m4a')).length;
  const videoCount = videos.length - audioCount;

  return (
    <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
      {/* Gün başlığı */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-indigo-400">folder</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-[15px] text-white">{label}</p>
            <p className="text-[11px] text-white/40">
              {videoCount > 0 && `${videoCount} video`}
              {videoCount > 0 && audioCount > 0 && ' · '}
              {audioCount > 0 && `${audioCount} ses`}
            </p>
          </div>
        </div>
        <span className={`material-symbols-outlined text-[20px] text-white/30 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-0'}`}>
          expand_more
        </span>
      </button>

      {/* İçerik grid */}
      {!collapsed && (
        <div className="px-3 pb-3 max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {videos.map((video, idx) => (
              <VideoCard
                key={idx}
                video={video}
                onShare={onShare}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// —— Video Thumbnail Kartı ——
function VideoCard({ video, onShare, onDelete }) {
  const { t } = useLanguage();
  const [thumbnail, setThumbnail] = React.useState(null);
  const [playerOpen, setPlayerOpen] = React.useState(false);

  const isAudio = video.name.includes('_Audio_') || video.name.endsWith('.m4a');

  React.useEffect(() => {
    if (!isAudio) {
      generateThumbnail(video.url).then(setThumbnail);
    }
  }, [video.url, isAudio]);

  return (
    <>
      <div className={`bg-white/5 rounded-2xl overflow-hidden border ${isAudio ? 'border-indigo-500/20' : 'border-white/10'} shadow-lg flex flex-col group backdrop-blur-sm transition-all hover:bg-white/10`}>
        {/* Thumbnail alanı */}
        <button
          onClick={() => setPlayerOpen(true)}
          className={`relative aspect-[9/16] w-full overflow-hidden focus:outline-none ${isAudio ? 'bg-[#12121a]' : 'bg-black'}`}
          aria-label={t('playVideo')}
        >
          {isAudio ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/5">
              <span className="material-symbols-outlined text-[50px] text-indigo-400/50">mic_external_on</span>
            </div>
          ) : thumbnail ? (
            <img
              src={thumbnail}
              alt="video thumbnail"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full bg-[#1a1a24] flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-white/10">movie</span>
            </div>
          )}

          {/* Play overlay butonu */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border shadow-xl group-hover:scale-110 transition-transform ${isAudio ? 'bg-indigo-500/30 border-indigo-500/40' : 'bg-white/10 border-white/20'}`}>
              <span className={`material-symbols-outlined text-[28px] ${isAudio ? 'text-indigo-400' : 'text-white'}`} style={{ fontVariationSettings: "'FILL' 1", marginLeft: isAudio ? '0px' : '4px' }}>
                {isAudio ? 'headphones' : 'play_arrow'}
              </span>
            </div>
          </div>
          {/* Boyut rozeti */}
          <div className={`absolute bottom-2 left-2 backdrop-blur-md rounded-lg px-2 py-1 ${isAudio ? 'bg-indigo-500/40' : 'bg-black/70'}`}>
            <span className={`text-[10px] font-bold ${isAudio ? 'text-indigo-100' : 'text-white/80'}`}>{video.size}</span>
          </div>
        </button>

        {/* Alt bilgi */}
        <div className="p-2 flex flex-col gap-1.5">
          <p className="text-[10px] text-white/60 font-medium">{video.date}</p>
          <div className="flex gap-1">
              <button
                onClick={() => onShare(video)}
                className="w-6 h-6 flex items-center justify-center bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-md transition-all active:scale-90"
                title={t('share')}
              >
                <span className="material-symbols-outlined text-[12px]">share</span>
              </button>
              <button
                onClick={() => onDelete(video.name)}
                className="w-6 h-6 flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-md transition-all active:scale-90"
                title={t('delete')}
              >
                <span className="material-symbols-outlined text-[12px]">delete</span>
              </button>
            </div>
        </div>
      </div>

      {/* Tam ekran oynatıcı modal */}
      {playerOpen && (
        <VideoPlayerModal video={video} isAudio={isAudio} onClose={() => setPlayerOpen(false)} />
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
function VideoPlayerModal({ video, isAudio, onClose }) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      {/* Kapat butonu */}
      <button
        onClick={onClose}
        className="absolute top-8 right-5 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90"
        aria-label={t('close')}
      >
        <span className="material-symbols-outlined text-white text-[24px]">close</span>
      </button>



      {/* Video oynatıcı */}
      {isAudio ? (
        <div className="w-full flex flex-col items-center justify-center gap-8 px-6">
          <div className="w-32 h-32 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-[60px] text-indigo-400">mic_external_on</span>
          </div>
          <audio
            src={video.url}
            controls
            autoPlay
            className="w-full max-w-sm"
          />
        </div>
      ) : (
        <video
          src={video.url}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain rounded-lg"
          style={{ maxHeight: '100dvh' }}
        />
      )}
    </div>
  );
}
