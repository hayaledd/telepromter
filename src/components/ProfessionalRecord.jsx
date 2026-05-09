import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import MobileMenu from './MobileMenu';
import { useLanguage } from '../context/LanguageContext';

export default function ProfessionalRecord() {
  const navigate = useNavigate();
  const { getActiveScript, globalFontSize, setGlobalFontSize } = useScript();
  const { t } = useLanguage();
  const script = getActiveScript();

  // If no script is active, redirect back to scripts list
  useEffect(() => {
    if (!script) {
      navigate('/scripts');
    }
  }, [script, navigate]);

  // Teleprompter State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [recordedMimeType, setRecordedMimeType] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'ok' | 'error'
  const [showMenu, setShowMenu] = useState(false);

  // Layouts: 'full' (camera behind text), 'bottom' (camera bottom, text top)
  const [layoutMode, setLayoutMode] = useState('bottom'); // 'bottom' or 'full'
  const [savedFileName, setSavedFileName] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoQuality, setVideoQuality] = useState('1080p');
  const [textColor, setTextColor] = useState('#ffffff');
  const [isMirrored, setIsMirrored] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('clean');
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [facingMode, setFacingMode] = useState('user');
  const [textWidth, setTextWidth] = useState('100%');
  // Detect best supported MIME type for this device
  const getSupportedMimeType = () => {
    const types = [
      'video/mp4',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const TEXT_COLORS = [
    { id: 'white',  value: '#ffffff', bg: 'bg-white' },
    { id: 'yellow', value: '#facc15', bg: 'bg-yellow-400' },
    { id: 'green',  value: '#4ade80', bg: 'bg-green-400' },
    { id: 'cyan',   value: '#22d3ee', bg: 'bg-cyan-400' },
  ];

  const QUALITY_OPTIONS = [
    { id: '480p',  label: '480p',  width: 854,  height: 480,  bps: 1_000_000 },
    { id: '720p',  label: '720p',  width: 1280, height: 720,  bps: 2_500_000 },
    { id: '1080p', label: '1080p', width: 1920, height: 1080, bps: 5_000_000 },
  ];

  const FILTERS = [
    { id: 'clean',    label: 'Temiz',      icon: 'wb_auto',       style: 'brightness(1.05) contrast(1.0) saturate(1.0)' },
    { id: 'warm',     label: 'Sıcak',      icon: 'wb_sunny',      style: 'brightness(1.05) contrast(1.05) saturate(1.2) sepia(0.15)' },
    { id: 'cool',     label: 'Soğuk',      icon: 'ac_unit',       style: 'brightness(1.02) contrast(1.05) saturate(0.9) hue-rotate(10deg)' },
    { id: 'cinema',   label: 'Sinema',     icon: 'movie',         style: 'brightness(0.92) contrast(1.25) saturate(0.85)' },
    { id: 'portrait', label: 'Portre',     icon: 'face',          style: 'brightness(1.08) contrast(0.95) saturate(1.1)' },
    { id: 'studio',   label: 'Stüdyo',     icon: 'videocam',      style: 'brightness(1.0) contrast(1.15) saturate(1.05) hue-rotate(-5deg)' },
    { id: 'bw',       label: 'S/B',        icon: 'exposure',      style: 'grayscale(1) brightness(1.05) contrast(1.2)' },
    { id: 'vivid',    label: 'Canlı',      icon: 'palette',       style: 'brightness(1.04) contrast(1.1) saturate(1.6)' },
  ];

  const currentFilter = FILTERS.find(f => f.id === activeFilter)?.style || 'brightness(1) contrast(1)';
  
  // Refs
  const videoRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);
  
  // Recording Refs
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const toggleLayout = () => {
    setLayoutMode(prev => prev === 'full' ? 'bottom' : 'full');
  };

  // Real elapsed time counter
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const startWithCountdown = () => {
    setCountdown(countdownDuration);
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      startWithCountdown();
    } else {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsPlaying(false);
    }
  };

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      // Actually start recording
      if (mediaStreamRef.current) {
        try {
          recordedChunksRef.current = [];
          const mimeType = getSupportedMimeType();
          if (!mimeType) {
            console.error('MediaRecorder: No supported MIME type found on this device!');
            setSaveStatus('error');
            return;
          }
          setRecordedMimeType(mimeType);
          const selectedQuality = QUALITY_OPTIONS.find(q => q.id === videoQuality);
          const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
            mimeType,
            videoBitsPerSecond: selectedQuality ? selectedQuality.bps : 5000000,
          });
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
          };
          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            setRecordedVideoUrl(URL.createObjectURL(blob));
          };
          // timeslice=1000 → her saniye ondataavailable tetiklenir (chunk garantisi)
          mediaRecorder.start(1000);
        } catch (e) {
          console.error('MediaRecorder start failed:', e);
          setSaveStatus('error');
        }
      }
      setIsPlaying(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const adjustSpeed = (delta) => {
    setSpeed(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  // Camera Setup
  useEffect(() => {
    let cancelled = false;

    async function setupCamera() {
      try {
        // 1) Önce video elementini temizle
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.load();
        }

        // 2) Eski stream'i durdur
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }

        // 3) Android'in kamera donanımını serbest bırakması için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 300));
        if (cancelled) return;

        // 4) Yeni stream al — exact constraint ile doğru kamera seçilir
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.load();
          // Kısa gecikme sonra play — bazı Android sürümlerinde gerekli
          await new Promise(resolve => setTimeout(resolve, 100));
          videoRef.current.play().catch(e => console.error('Video play error:', e));
        }
      } catch (err) {
        if (cancelled) return;
        // exact constraint başarısız olursa ideal ile tekrar dene
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: true,
          });
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.load();
            await new Promise(resolve => setTimeout(resolve, 100));
            videoRef.current.play().catch(e => console.error('Video play error:', e));
          }
        } catch (fallbackErr) {
          console.error('Camera access failed:', fallbackErr);
        }
      }
    }

    setupCamera();

    return () => {
      cancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [facingMode]);


  // Scrolling Engine
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      
      const scrollLoop = (time) => {
        const deltaTime = time - lastTime;
        lastTime = time;

        if (scrollContainerRef.current) {
          // Calculate pixels to move per frame based on speed
          const pixelsPerFrame = (speed * 0.05) * deltaTime;
          scrollContainerRef.current.scrollTop += pixelsPerFrame;
        }
        animationRef.current = requestAnimationFrame(scrollLoop);
      };
      
      animationRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed]);

  // If not loaded yet, return null
  if (!script) return null;

  // Split script content into paragraphs
  const scriptLines = script.content.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="bg-background text-on-background fixed inset-0 h-[100dvh] w-screen overflow-hidden overscroll-none flex flex-col font-body-md dark">
      {/* HUD Overlay */}
      <div className="fixed top-0 left-0 w-full z-40 p-4 flex justify-between items-start">
        <div className="flex items-center gap-2 bg-surface-container/30 backdrop-blur-xl shadow-sm rounded-full px-4 py-2 border border-white/10 pointer-events-auto">
          <span className="flex h-3 w-3 relative">
            {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]' : 'bg-surface-variant'}`}></span>
          </span>
          <span className={`font-bold text-[12px] tracking-widest uppercase ${isPlaying ? 'text-error' : 'text-on-surface-variant'}`}>{isPlaying ? t('recording') : t('ready')}</span>
          <span className="font-body-md text-on-surface ml-1 tabular-nums">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => setShowMenu(true)}
            className="flex items-center gap-1.5 backdrop-blur-xl shadow-sm rounded-full px-3 py-2 border border-white/10 transition-colors bg-surface-container/30 text-on-surface hover:bg-surface-variant/50"
            title={t('menu')}
          >
            <span className="material-symbols-outlined text-[18px]">menu</span>
          </button>
          <button 
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            className="flex items-center gap-1.5 backdrop-blur-xl shadow-sm rounded-full px-3 py-2 border border-white/10 transition-colors bg-surface-container/30 text-on-surface hover:bg-surface-variant/50"
            title={t('flipCamera')}
          >
            <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
          </button>
          <button
            onClick={() => { setShowSettings(!showSettings); setShowFilters(false); }}
            className={`flex items-center gap-1.5 backdrop-blur-xl shadow-sm rounded-full px-3 py-2 border border-white/10 transition-colors ${showSettings ? 'bg-primary text-on-primary' : 'bg-surface-container/30 text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span className="font-bold text-[11px] tracking-widest uppercase">{videoQuality}</span>
          </button>
        </div>
      </div>

      <div className={`flex-1 w-full relative flex flex-col group ${layoutMode} mb-[72px] landscape:mb-0 landscape:mr-[72px]`} id="layout-container">
        {/* Camera Feed Area (Always Fullscreen in Background) */}
        <div className="absolute inset-0 w-full h-full z-0 bg-black">
          <video ref={videoRef} autoPlay playsInline muted
            className="w-full h-full object-cover opacity-90"
            style={{ filter: currentFilter, transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          />
        </div>

        {/* Teleprompter Area */}
        <div className={`absolute w-full flex flex-col items-center overflow-hidden transition-all duration-300 z-10 bg-transparent ${
          layoutMode === 'bottom' 
            ? 'bottom-0 h-[50vh] border-t border-white/20 backdrop-blur-sm' 
            : 'inset-0 h-full'
        }`}>
          {layoutMode === 'bottom' && (
            <div className="absolute top-[20%] w-full border-t border-primary/50 shadow-[0_0_10px_rgba(173,198,255,0.3)] z-20 pointer-events-none flex items-center justify-between px-2">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-primary/70 border-b-[6px] border-b-transparent drop-shadow-[0_0_4px_rgba(173,198,255,0.8)]"></div>
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[10px] border-r-primary/70 border-b-[6px] border-b-transparent drop-shadow-[0_0_4px_rgba(173,198,255,0.8)]"></div>
            </div>
          )}

          {/* Scrolling Text Container */}
          <div ref={scrollContainerRef} className="absolute inset-0 w-full h-full mx-auto px-edge-margin-tablet overflow-y-auto overscroll-none touch-pan-y space-y-12 text-center z-10 text-shadow-lg pt-[40vh] pb-[60vh]" style={{ maxWidth: textWidth, scrollBehavior: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', transform: isMirrored ? 'scaleX(-1)' : 'none' }}>
            {scriptLines.map((line, idx) => (
              <p key={idx} className="font-prompter-display font-bold drop-shadow-xl" style={{ fontSize: `${globalFontSize}px`, lineHeight: 1.4, color: textColor }}>
                {line}
              </p>
            ))}
          </div>
          {/* Gradient fade masks - very subtle */}
          <div className="absolute top-0 w-full h-16 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none"></div>
          {/* Floating Speed Control */}
          <div className="absolute right-edge-margin-tablet top-1/2 -translate-y-1/2 z-30 bg-surface-container-high/40 backdrop-blur-xl rounded-full p-2 flex flex-col items-center gap-4 border border-white/10 shadow-2xl">
            <button onClick={() => adjustSpeed(1)} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
            <div className="h-32 w-1.5 bg-black/40 rounded-full relative shadow-inner">
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-primary/50 to-primary rounded-full shadow-[0_0_8px_rgba(173,198,255,0.4)]" style={{ height: `${speed * 10}%` }}></div>
            </div>
            <span className="font-label-caps text-label-caps text-primary drop-shadow-sm">{speed / 5}x</span>
            <button onClick={() => adjustSpeed(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors">
              <span className="material-symbols-outlined text-[20px]">remove</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Control Bar */}
      <div className="fixed bottom-0 landscape:bottom-auto landscape:right-0 landscape:h-screen left-0 w-full landscape:w-control-bar-height bg-surface-container-lowest/80 backdrop-blur-2xl h-control-bar-height flex landscape:flex-col items-center justify-center px-2 landscape:py-4 z-50 border-t landscape:border-t-0 landscape:border-l border-white/5 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex landscape:flex-col items-center gap-2 w-full landscape:h-full max-w-2xl justify-between">
          {/* Left Actions */}
          <div className="flex landscape:flex-col gap-1">
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showFilters ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant/50'}`}
              >
                <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
              </button>
              <span className="text-[9px] text-outline uppercase font-bold tracking-tighter">{t('filters')}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${layoutMode === 'full' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant/50'}`}
                onClick={toggleLayout} 
                title={t('viewMode')}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {layoutMode === 'full' ? 'fullscreen' : 'splitscreen'}
                </span>
              </button>
              <span className="text-[9px] text-outline uppercase font-bold tracking-tighter">{t('viewMode')}</span>
            </div>
          </div>
          {/* Primary Record/Stop Action */}
          <div className="flex flex-col items-center relative -top-3 landscape:top-0 landscape:-left-3 shrink-0">
            <button onClick={togglePlayback} className="w-16 h-16 md:w-20 md:h-20 bg-surface-container-lowest rounded-full flex items-center justify-center border-[4px] border-surface-variant/80 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.5)] active:scale-95 transition-transform backdrop-blur-xl">
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-sm transition-all duration-300 ${isPlaying ? 'bg-gradient-to-br from-error to-error-container animate-pulse shadow-[0_0_16px_rgba(255,180,171,0.6)]' : 'bg-primary rounded-full'}`}></div>
            </button>
            <span className={`text-[10px] uppercase font-bold tracking-widest mt-1 md:mt-2 drop-shadow-sm ${isPlaying ? 'text-error' : 'text-primary'}`}>{isPlaying ? t('stop') : t('start')}</span>
          </div>
          {/* Right Actions */}
          <div className="flex landscape:flex-col gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center bg-surface-variant/30 rounded-full h-12 px-1 gap-0.5 border border-white/5">
                <button 
                  onClick={() => setGlobalFontSize(prev => Math.max(16, prev - 4))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">text_decrease</span>
                </button>
                <button 
                  onClick={() => setGlobalFontSize(prev => Math.min(96, prev + 4))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">text_increase</span>
                </button>
              </div>
              <span className="text-[9px] text-outline uppercase font-bold tracking-tighter">{t('size')}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => navigate('/editor')} className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <span className="text-[9px] text-outline uppercase font-bold tracking-tighter">{t('close')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[120px] font-black text-white leading-none drop-shadow-[0_0_40px_rgba(173,198,255,0.8)] animate-pulse">
              {countdown}
            </span>
            <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">{t('getReady')}</span>
          </div>
        </div>
      )}

      {/* Video Settings Panel */}
      {showSettings && (
        <div className="fixed top-[72px] right-4 landscape:right-[88px] z-[60] bg-surface-container-lowest/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[220px]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t('videoSettings')}</span>
            <button onClick={() => setShowSettings(false)} className="text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{t('textColor')}</p>
            <div className="flex gap-2">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setTextColor(c.value)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform ${
                    textColor === c.value ? 'border-primary scale-110' : 'border-transparent'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full shadow-inner ${c.bg}`}></span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{t('quality')}</p>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map(q => (
                <button
                  key={q.id}
                  onClick={() => setVideoQuality(q.id)}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                    videoQuality === q.id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 opacity-60">
              {t('webmNote')}
            </p>
          </div>
          
          <div className="mb-4 mt-4">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{t('eyeContact')}</p>
            <div className="flex gap-2">
              {[{label: 'Geniş', val: '100%'}, {label: 'Orta', val: '75%'}, {label: 'Dar', val: '50%'}].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setTextWidth(opt.val)}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                    textWidth === opt.val
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4 mt-4">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{t('countdown')}</p>
            <div className="flex gap-2">
              {[3, 5, 10].map(sec => (
                <button
                  key={sec}
                  onClick={() => setCountdownDuration(sec)}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                    countdownDuration === sec
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className="w-full mt-4 bg-primary text-on-primary font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            {t('save')}
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="fixed bottom-[72px] left-0 w-full z-[60] bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-white/10 px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t('cameraFilters')}</span>
            <button onClick={() => setShowFilters(false)} className="text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
                  activeFilter === f.id
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden border border-white/10">
                  <span className="material-symbols-outlined text-[22px]" style={{ filter: f.style !== 'none' ? f.style : undefined }}>{f.icon}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}


      {recordedVideoUrl && (
        <div className="fixed inset-0 z-[100] bg-surface-container-lowest/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-center">
             <div className="bg-surface-container-high/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                <span className="text-white font-bold tracking-wide text-[14px] uppercase">{t('saved')}</span>
             </div>
          </div>

          {/* Video Player */}
          <div className="w-full max-w-sm my-auto relative group flex-shrink-0">
            {/* Arka plan parlama efekti */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-tertiary/30 blur-2xl opacity-50 rounded-[40px] -z-10 transition-opacity duration-500 group-hover:opacity-70"></div>
            
            <div className="rounded-[32px] overflow-hidden border-4 border-surface-container-high shadow-2xl relative bg-black aspect-[9/16] max-h-[60vh] flex items-center justify-center">
              <video 
                src={recordedVideoUrl} 
                controls 
                playsInline 
                autoPlay
                className="w-full h-full object-cover"
              ></video>
            </div>
          </div>

          {/* Durum Mesajı */}
          <div className="h-10 mb-4 flex items-center justify-center">
            {saveStatus && (
              <div className={`px-5 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
                saveStatus === 'saving' ? 'bg-surface-variant text-on-surface-variant' :
                saveStatus === 'ok'     ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                         'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {saveStatus === 'saving' && <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>}
                {saveStatus === 'ok'     && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                {saveStatus === 'error'  && <span className="material-symbols-outlined text-[16px]">error</span>}
                {saveStatus === 'saving' ? t('saving') :
                 saveStatus === 'ok'    ? t('saveSuccess') :
                                         t('saveError')}
              </div>
            )}
          </div>
          
          {/* Aksiyon Butonları */}
          <div className="w-full max-w-sm flex flex-col gap-3">
            {!saveStatus || saveStatus === 'error' ? (
              <>
                <button 
                  disabled={saveStatus === 'saving'}
                  onClick={async () => {
                    setSaveStatus('saving');
                    try {
                      const response = await fetch(recordedVideoUrl);
                      const blob = await response.blob();
                      const ext = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
                      const fileName = `ScriptFlow_Recording_${Date.now()}.${ext}`;
                      await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = async () => {
                          try {
                            await Filesystem.writeFile({
                              path: fileName,
                              data: reader.result,
                              directory: Directory.Documents
                            });
                            setSavedFileName(fileName);
                            resolve();
                          } catch(err) { reject(err); }
                        };
                        reader.onerror = reject;
                      });
                      setSaveStatus('ok');
                    } catch (e) {
                      console.error('Save error:', e);
                      setSaveStatus('error');
                    }
                  }}
                  className="w-full bg-primary text-on-primary font-bold text-[16px] py-4 rounded-2xl active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(173,198,255,0.25)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saveStatus === 'saving' ? (
                    <>
                       <span className="animate-spin material-symbols-outlined text-[20px]">sync</span>
                       {t('saving')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[22px]">download</span>
                      {t('saveToDevice')}
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button 
                    disabled={saveStatus === 'saving'}
                    onClick={() => {
                      setRecordedVideoUrl(null);
                      setSaveStatus(null);
                      setSavedFileName(null);
                      recordedChunksRef.current = [];
                    }}
                    className="flex-1 bg-white/5 text-white/70 font-bold text-[15px] py-4 rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all border border-white/5 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    {t('deleteAndRetake')}
                  </button>
                  <button 
                    disabled={saveStatus === 'saving'}
                    onClick={async () => {
                      try {
                        let currentFileName = savedFileName;
                        if (!currentFileName) {
                          setSaveStatus('saving');
                          const response = await fetch(recordedVideoUrl);
                          const blob = await response.blob();
                          const ext = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
                          currentFileName = `ScriptFlow_Recording_${Date.now()}.${ext}`;
                          await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = async () => {
                              try {
                                await Filesystem.writeFile({ path: currentFileName, data: reader.result, directory: Directory.Documents });
                                setSavedFileName(currentFileName);
                                resolve();
                              } catch(err) { reject(err); }
                            };
                            reader.onerror = reject;
                          });
                          setSaveStatus('ok');
                        }
                        const stat = await Filesystem.stat({ path: currentFileName, directory: Directory.Documents });
                        await Share.share({ title: currentFileName, text: t('recordedWith'), url: stat.uri, dialogTitle: t('shareVideoTitle') });
                      } catch(e) { console.error('Share error', e); setSaveStatus('error'); }
                    }}
                    className="flex-1 bg-tertiary text-on-tertiary font-bold text-[15px] py-4 rounded-2xl hover:bg-tertiary/90 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    {t('share')}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2 flex-col">
                <button 
                  onClick={async () => {
                    try {
                      const stat = await Filesystem.stat({ path: savedFileName, directory: Directory.Documents });
                      await Share.share({ title: savedFileName, text: t('recordedWith'), url: stat.uri, dialogTitle: t('shareVideoTitle') });
                    } catch(e) { console.error('Share error', e); }
                  }}
                  className="w-full bg-tertiary text-on-tertiary font-bold text-[16px] py-4 rounded-2xl hover:bg-tertiary/90 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 mb-2"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                  {t('share')}
                </button>
                <button 
                  onClick={() => {
                    setRecordedVideoUrl(null);
                    setSaveStatus(null);
                    setSavedFileName(null);
                    recordedChunksRef.current = [];
                  }}
                  className="w-full bg-white/10 text-white font-bold text-[16px] py-4 rounded-2xl hover:bg-white/15 active:scale-[0.98] transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                  {t('newRecording')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Mobile Menu */}
      <MobileMenu show={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
