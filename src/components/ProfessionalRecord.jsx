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
  const { t, lang } = useLanguage();
  const script = getActiveScript();

  // If no script is active, redirect back to scripts list
  useEffect(() => {
    if (!script) {
      navigate('/scripts');
    }
  }, [script, navigate]);

  // Teleprompter State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [recordedMimeType, setRecordedMimeType] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'ok' | 'error'
  const [showMenu, setShowMenu] = useState(false);

  // Layouts: 'full' (camera behind text), 'bottom' (camera bottom, text top)
  const [layoutMode, setLayoutMode] = useState('bottom'); // 'bottom' or 'full'
  const [savedFileName, setSavedFileName] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [textColor, setTextColor] = useState('#ffffff');
  const [isMirrored, setIsMirrored] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('clean');
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [facingMode, setFacingMode] = useState('user');
  const [textWidth, setTextWidth] = useState('100%');
  const [frameRate, setFrameRate] = useState(30);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [prompterBg, setPrompterBg] = useState('dark');
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
    { id: 'white', value: '#ffffff', bg: 'bg-white' },
    { id: 'yellow', value: '#facc15', bg: 'bg-yellow-400' },
    { id: 'green', value: '#4ade80', bg: 'bg-green-400' },
    { id: 'cyan', value: '#22d3ee', bg: 'bg-cyan-400' },
  ];

  const BG_COLORS = [
    { id: 'none', label: t('color_none'), value: 'transparent', border: 'border-white/20', preview: 'bg-transparent border-2 border-white/30' },
    { id: 'black', label: t('color_black'), value: 'rgba(0,0,0,0.85)', border: 'border-white/10', preview: 'bg-black' },
    { id: 'navy', label: t('color_navy'), value: 'rgba(10,15,50,0.90)', border: 'border-blue-500/20', preview: 'bg-[#0a0f32]' },
    { id: 'dark', label: t('color_dark'), value: 'rgba(20,20,25,0.90)', border: 'border-white/10', preview: 'bg-[#141419]' },
    { id: 'green', label: t('color_green'), value: 'rgba(0,40,20,0.90)', border: 'border-green-500/20', preview: 'bg-[#002814]' },
    { id: 'red', label: t('color_red'), value: 'rgba(50,0,0,0.90)', border: 'border-red-500/20', preview: 'bg-[#320000]' },
    { id: 'purple', label: t('color_purple'), value: 'rgba(30,0,50,0.90)', border: 'border-purple-500/20', preview: 'bg-[#1e0032]' },
    { id: 'white', label: t('color_white'), value: 'rgba(255,255,255,0.90)', border: 'border-gray-300', preview: 'bg-white' },
  ];

  const QUALITY_OPTIONS = [
    { id: 'auto', label: 'Cihaz', bps: 8_000_000 }, // Cihazın kendi kalitesi
    { id: '480p', label: '480p', width: 854, height: 480, bps: 1_000_000 },
    { id: '720p', label: '720p', width: 1280, height: 720, bps: 2_500_000 },
    { id: '1080p', label: '1080p', width: 1920, height: 1080, bps: 5_000_000 },
  ];

  const FILTERS = [
    { id: 'clean', label: t('filter_clean'), icon: 'wb_auto', style: 'brightness(1.05) contrast(1.0) saturate(1.0)' },
    { id: 'warm', label: t('filter_warm'), icon: 'wb_sunny', style: 'brightness(1.05) contrast(1.05) saturate(1.2) sepia(0.15)' },
    { id: 'cool', label: t('filter_cool'), icon: 'ac_unit', style: 'brightness(1.02) contrast(1.05) saturate(0.9) hue-rotate(10deg)' },
    { id: 'cinema', label: t('filter_cinema'), icon: 'movie', style: 'brightness(0.92) contrast(1.25) saturate(0.85)' },
    { id: 'portrait', label: t('filter_portrait'), icon: 'face', style: 'brightness(1.08) contrast(0.95) saturate(1.1)' },
    { id: 'studio', label: t('filter_studio'), icon: 'videocam', style: 'brightness(1.0) contrast(1.15) saturate(1.05) hue-rotate(-5deg)' },
    { id: 'bw', label: t('filter_bw'), icon: 'exposure', style: 'grayscale(1) brightness(1.05) contrast(1.2)' },
    { id: 'vivid', label: t('filter_vivid'), icon: 'palette', style: 'brightness(1.04) contrast(1.1) saturate(1.6)' },
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
  const wakeLockRef = useRef(null);

  useEffect(() => {
    const acquireWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };
    if (isPlaying || isRecordingActive) {
      acquireWakeLock();
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => { });
      wakeLockRef.current = null;
    }
  }, [isPlaying, isRecordingActive]);

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

  const toggleReading = () => {
    if (isRecordingActive) return;
    setIsPlaying(!isPlaying);
  };

  const toggleRecording = () => {
    if (!isRecordingActive) {
      if (isPlaying) setIsPlaying(false);
      startWithCountdown();
    } else {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingActive(false);
      setIsPlaying(false);
    }
  };

  // Bluetooth / Keyboard Remote Support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case ' ':
        case 'Enter':
        case 'MediaPlayPause':
          e.preventDefault();
          if (!isRecordingActive) toggleReading();
          break;
        case 'ArrowUp':
        case 'PageUp':
        case '+':
          e.preventDefault();
          setSpeed(prev => Math.max(1, Math.min(10, prev + 1)));
          break;
        case 'ArrowDown':
        case 'PageDown':
        case '-':
          e.preventDefault();
          setSpeed(prev => Math.max(1, Math.min(10, prev - 1)));
          break;
        case 'r':
        case 'R':
        case 'Escape':
          e.preventDefault();
          toggleRecording();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isRecordingActive]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      // Actually start recording
      if (mediaStreamRef.current) {
        let isRecording = true;
        let intervalId = null;
        let compositeCanvas = null;
        try {
          recordedChunksRef.current = [];
          const mimeType = getSupportedMimeType();
          if (!mimeType) {
            console.error('MediaRecorder: No supported MIME type found on this device!');
            setSaveStatus('error');
            setIsRecordingActive(false);
            setIsPlaying(false);
            return;
          }
          setRecordedMimeType(mimeType);
          const selectedQuality = QUALITY_OPTIONS.find(q => q.id === videoQuality);
          const isPortrait = window.innerHeight > window.innerWidth;
          let width = 1920;
          let height = 1080;

          if (videoQuality === 'auto' && videoRef.current) {
            // Telefonun kamerasından gelen Orijinal Çözünürlüğü kullan
            width = videoRef.current.videoWidth || (isPortrait ? 1080 : 1920);
            height = videoRef.current.videoHeight || (isPortrait ? 1920 : 1080);
          } else if (selectedQuality && selectedQuality.width) {
            // Dikey tutuşta en/boy oranını bozmamak için yer değiştir
            width = isPortrait ? selectedQuality.height : selectedQuality.width;
            height = isPortrait ? selectedQuality.width : selectedQuality.height;
          }

          // Create a composite canvas to mix video, avatar, filters, and mirroring
          compositeCanvas = document.createElement('canvas');
          compositeCanvas.width = width;
          compositeCanvas.height = height;

          // Android WebView'de off-screen canvas ekranı bozmasın diye fixed 1x1 yapıyoruz
          compositeCanvas.style.position = 'fixed';
          compositeCanvas.style.top = '0';
          compositeCanvas.style.left = '0';
          compositeCanvas.style.width = '1px';
          compositeCanvas.style.height = '1px';
          compositeCanvas.style.opacity = '0.01';
          compositeCanvas.style.pointerEvents = 'none';
          document.body.appendChild(compositeCanvas);

          const ctx = compositeCanvas.getContext('2d');

          const renderComposite = () => {
            if (!isRecording) {
              if (intervalId) clearInterval(intervalId);
              return;
            }

            ctx.save();
            if (isMirrored) {
              ctx.translate(width, 0);
              ctx.scale(-1, 1);
            }
            if (currentFilter && currentFilter !== 'none') {
              ctx.filter = currentFilter;
            }
            if (videoRef.current && videoRef.current.readyState >= 2) {
              ctx.drawImage(videoRef.current, 0, 0, width, height);
            } else {
              ctx.fillStyle = "black";
              ctx.fillRect(0, 0, width, height);
            }
            ctx.restore();
          };
          intervalId = setInterval(renderComposite, 1000 / 30); // 30 FPS

          let videoStream;
          if (typeof compositeCanvas.captureStream === 'function') {
            videoStream = compositeCanvas.captureStream(30);
          } else {
            console.warn("captureStream not supported, falling back to raw stream");
            videoStream = new MediaStream(mediaStreamRef.current.getVideoTracks());
          }

          const audioTracks = mediaStreamRef.current.getAudioTracks();
          if (audioTracks.length > 0) {
            videoStream.addTrack(audioTracks[0]);
          }

          const mediaRecorder = new MediaRecorder(videoStream, {
            mimeType,
            videoBitsPerSecond: selectedQuality ? selectedQuality.bps : 5000000,
          });
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
          };
          mediaRecorder.onstop = () => {
            isRecording = false;
            if (intervalId) clearInterval(intervalId);
            if (compositeCanvas && document.body.contains(compositeCanvas)) {
              document.body.removeChild(compositeCanvas);
            }
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            setRecordedVideoUrl(URL.createObjectURL(blob));
          };
          // timeslice=1000 → her saniye ondataavailable tetiklenir (chunk garantisi)
          mediaRecorder.start(1000);

          setIsRecordingActive(true);
          setIsPlaying(true);
        } catch (e) {
          console.error('MediaRecorder start failed:', e);
          isRecording = false;
          if (intervalId) clearInterval(intervalId);
          if (compositeCanvas && document.body.contains(compositeCanvas)) {
            document.body.removeChild(compositeCanvas);
          }
          setSaveStatus('error');
          setIsRecordingActive(false);
          setIsPlaying(false);
        }
      }
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const adjustSpeed = (delta) => {
    setSpeed(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  // Estimated reading time based on current speed
  const getReadTime = () => {
    if (!script) return '';
    const wpm = speed * 30; // speed 1=30wpm, speed 5=150wpm, speed 10=300wpm
    const words = script.content.trim().split(/\s+/).filter(Boolean).length;
    const totalSecs = Math.round((words / wpm) * 60);
    if (totalSecs < 60) return `~${totalSecs}sn`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs > 0 ? `~${mins}dk ${secs}sn` : `~${mins}dk`;
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
            frameRate: { ideal: frameRate },
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
        // exact constraint başarısız olursa her şeyi esnek bırakarak tekrar dene (Özellikle PC'lerde siyah ekranı çözer)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
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
          alert('Kamera veya mikrofonunuza erişilemiyor. Lütfen tarayıcı izinlerini kontrol edin veya kameranızın başka bir uygulama tarafından kullanılmadığından emin olun.');
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
  }, [facingMode, frameRate]);
  // Scrolling Engine
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();

      const scrollLoop = (time) => {
        const deltaTime = time - lastTime;
        lastTime = time;

        if (scrollContainerRef.current && speed > 0) {
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
      <div className="fixed top-0 left-0 w-full z-40 p-4 flex justify-between items-start pointer-events-none">
        {/* Left Side: Back + Status */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface-container/30 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>
          <div className="flex items-center gap-2 bg-surface-container/30 backdrop-blur-xl shadow-sm rounded-full px-4 py-2 border border-white/10">
            <span className="flex h-3 w-3 relative">
              {isRecordingActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>}
              {isPlaying && !isRecordingActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRecordingActive ? 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]' : isPlaying ? 'bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-surface-variant'}`}></span>
            </span>
            <span className={`font-bold text-[12px] tracking-widest uppercase ${isRecordingActive ? 'text-error' : isPlaying ? 'text-primary' : 'text-on-surface-variant'}`}>{isRecordingActive ? t('recording') : isPlaying ? (t('reading') || 'OKUNUYOR') : t('ready')}</span>
            <span className="font-body-md text-on-surface ml-1 tabular-nums">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Right Side: Flip + Settings */}
        <div className="flex items-center gap-2 pointer-events-auto shrink-0 pl-2">
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
            <span className="font-bold text-[11px] tracking-widest uppercase hidden md:inline">{videoQuality}</span>
          </button>
        </div>
      </div>

      <div className={`flex-1 w-full relative flex flex-col group ${layoutMode} mb-[72px] landscape:mb-0 landscape:mr-[72px]`} id="layout-container">
        {/* Camera Feed Area */}
        <div className="absolute inset-0 w-full h-full z-0 bg-black">
          <video ref={videoRef} autoPlay playsInline muted controls={false} disablePictureInPicture disableRemotePlayback
            className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${(layoutMode === 'prompter-only') ? 'opacity-0' : 'opacity-90'}`}
            style={{ filter: currentFilter, transform: `scaleX(${isMirrored ? -1 : 1}) scale(${zoomLevel})` }}
          />
        </div>

        {/* Teleprompter Area */}
        <div
          className={`absolute w-full flex flex-col items-center overflow-hidden transition-all duration-300 z-10 ${layoutMode === 'bottom' ? 'bottom-0 h-[50vh]' : 'inset-0 h-full'
            }`}
          style={{ backgroundColor: prompterBg === 'none' ? (layoutMode === 'prompter-only' ? 'black' : 'transparent') : BG_COLORS.find(b => b.id === prompterBg)?.value }}
        >


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
          <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 w-auto z-40">
            <div className="bg-[#1a1a24]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl py-2 px-3 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <button onClick={() => adjustSpeed(-1)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95">
                  <span className="material-symbols-outlined text-[18px] font-bold">remove</span>
                </button>
                <div className="flex items-center justify-center min-w-[44px]">
                  <span className="font-black text-primary text-[15px] leading-none">{speed / 5}x</span>
                </div>
                <button onClick={() => adjustSpeed(1)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95">
                  <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                </button>
              </div>
              <div className="flex items-center justify-center w-full mt-1">
                <span className="text-[10px] text-white/40 font-bold tracking-wide">{getReadTime()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Control Bar */}
      <div className="fixed bottom-0 landscape:bottom-auto landscape:right-0 landscape:h-screen left-0 w-full landscape:w-control-bar-height bg-surface-container-lowest/80 backdrop-blur-2xl h-control-bar-height flex landscape:flex-col items-center justify-center px-2 landscape:py-4 z-50 border-t landscape:border-t-0 landscape:border-l border-white/5 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex landscape:flex-col items-end landscape:items-center gap-2 w-full landscape:h-full max-w-2xl justify-between relative -top-2 landscape:top-0">
          {/* Left Actions */}
          <div className="flex landscape:flex-col items-end landscape:items-center gap-1">
            <div className="relative flex flex-col items-center gap-1">
              {showFilters && (
                <div className="absolute bottom-[100%] left-0 mb-4 landscape:mb-0 landscape:bottom-auto landscape:top-1/2 landscape:-translate-y-1/2 landscape:left-auto landscape:right-[100%] landscape:mr-4 bg-surface-container-lowest/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl z-[70] min-w-[160px] max-h-[50vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setActiveFilter(f.id); setShowFilters(false); }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all ${activeFilter === f.id
                          ? 'bg-primary/20 text-primary'
                          : 'text-white hover:bg-surface-variant/50'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ filter: f.style !== 'none' ? f.style : undefined }}>{f.icon}</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => { setShowFilters(!showFilters); setShowLayoutMenu(false); }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showFilters ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant/50'}`}
              >
                <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
              </button>
              <span className="text-[9px] text-outline uppercase font-bold tracking-tighter">{t('filters')}</span>
            </div>
            <div className="relative flex flex-col items-center gap-1">
              {showLayoutMenu && (
                <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 mb-4 landscape:mb-0 landscape:bottom-auto landscape:top-1/2 landscape:-translate-y-1/2 landscape:left-auto landscape:right-[100%] landscape:mr-4 bg-surface-container-lowest/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl z-[70] min-w-[150px]">
                  <button onClick={() => { setLayoutMode('bottom'); setShowLayoutMenu(false) }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold ${layoutMode === 'bottom' ? 'bg-primary/20 text-primary' : 'text-white hover:bg-surface-variant/50'}`}>
                    <span className="material-symbols-outlined text-[18px]">splitscreen</span>
                    {t('camBottom')}
                  </button>
                  <button onClick={() => { setLayoutMode('full'); setShowLayoutMenu(false) }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold ${layoutMode === 'full' ? 'bg-primary/20 text-primary' : 'text-white hover:bg-surface-variant/50'}`}>
                    <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                    {t('fullScreen')}
                  </button>
                  <button onClick={() => { setLayoutMode('prompter-only'); setShowLayoutMenu(false) }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold ${layoutMode === 'prompter-only' ? 'bg-primary/20 text-primary' : 'text-white hover:bg-surface-variant/50'}`}>
                    <span className="material-symbols-outlined text-[18px]">tv</span>
                    {t('prompterOnly')}
                  </button>
                </div>
              )}
              <button
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showLayoutMenu || layoutMode !== 'bottom' ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant/50'}`}
                onClick={() => { setShowLayoutMenu(!showLayoutMenu); setShowFilters(false); }}
                title={t('viewMode')}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {layoutMode === 'full' ? 'fullscreen' : layoutMode === 'prompter-only' ? 'tv' : 'splitscreen'}
                </span>
              </button>
              <span className="text-[9px] text-outline uppercase font-bold tracking-tighter">
                {layoutMode === 'prompter-only' ? t('prompterOnly') || 'SADECE METİN' : t('viewMode')}
              </span>
            </div>
          </div>
          {/* Action Buttons Container */}
          <div className="flex items-end gap-4 shrink-0">
            {/* Play/Read Only Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleReading}
                disabled={isRecordingActive}
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center border-[3px] active:scale-95 transition-all duration-300 ${isPlaying && !isRecordingActive
                    ? 'bg-[#1a1a24] border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                    : 'bg-[#1a1a24] border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.5)] hover:border-indigo-400/30'
                  } ${isRecordingActive ? 'opacity-50 cursor-not-allowed scale-90 grayscale' : ''}`}
              >
                <span className={`material-symbols-outlined text-[28px] transition-colors ${isPlaying && !isRecordingActive ? 'text-indigo-400' : 'text-white'
                  }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {(isPlaying && !isRecordingActive) ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <span className={`text-[9px] uppercase font-bold tracking-widest drop-shadow-sm ${(isPlaying && !isRecordingActive) ? 'text-indigo-400' : 'text-white/60'}`}>
                {(isPlaying && !isRecordingActive) ? (t('stop') || 'DURDUR') : (t('read') || 'OKU')}
              </span>
            </div>

            {/* Primary Record/Stop Action */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleRecording}
                disabled={isPlaying && !isRecordingActive}
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center border-[3px] active:scale-95 transition-all duration-300 ${isRecordingActive
                    ? 'bg-[#1a1a24] border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                    : 'bg-[#1a1a24] border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.5)] hover:border-rose-400/30'
                  } ${(isPlaying && !isRecordingActive) ? 'opacity-50 cursor-not-allowed scale-90 grayscale' : ''}`}
              >
                <div className={`transition-all duration-300 ${isRecordingActive
                    ? 'w-5 h-5 rounded-md bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                    : 'w-7 h-7 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  }`}></div>
              </button>
              <span className={`text-[9px] uppercase font-bold tracking-widest drop-shadow-sm ${isRecordingActive ? 'text-rose-400' : 'text-white/60'}`}>
                {isRecordingActive ? t('stop') : (t('record') || 'KAYIT')}
              </span>
            </div>
          </div>
          {/* Right Actions */}
          <div className="flex landscape:flex-col items-end landscape:items-center gap-1">
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
              <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors">
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
        <div className="fixed top-[72px] right-4 landscape:right-[88px] z-[60] bg-surface-container-lowest/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[220px] max-h-[calc(100vh-100px)] overflow-y-auto pb-6" style={{ scrollbarWidth: 'none' }}>
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform ${textColor === c.value ? 'border-primary scale-110' : 'border-transparent'
                    }`}
                >
                  <span className={`w-6 h-6 rounded-full shadow-inner ${c.bg}`}></span>
                </button>
              ))}
            </div>
          </div>

          {/* BG Color Picker */}
          <div className="mb-4">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{t('bgColor')}</p>
            <div className="grid grid-cols-4 gap-2">
              {BG_COLORS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setPrompterBg(b.id)}
                  className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all ${prompterBg === b.id ? 'border-primary scale-105' : 'border-transparent'
                    }`}
                >
                  <span className={`w-8 h-8 rounded-lg shadow-inner ${b.preview}`}></span>
                  <span className="text-[9px] text-white/50 font-bold">{b.label}</span>
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
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${videoQuality === q.id
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
              {[{ label: t('width_wide'), val: '100%' }, { label: t('width_medium'), val: '75%' }, { label: t('width_narrow'), val: '50%' }].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setTextWidth(opt.val)}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${textWidth === opt.val
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
                  className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${countdownDuration === sec
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                    }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* PROFESSIONAL CAMERA SETTINGS */}
          <div className="mt-2 border-t border-white/10 pt-4">
            <button
              onClick={() => setShowCameraSettings(!showCameraSettings)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <p className="text-[11px] text-primary uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                {t('camSettings')}
              </p>
              <span className="material-symbols-outlined text-[16px] text-white/40 transition-transform" style={{ transform: showCameraSettings ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            </button>

            {showCameraSettings && (
              <div className="flex flex-col gap-4">
                {/* Frame Rate */}
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{t('fps')}</p>
                  <div className="flex gap-2">
                    {[24, 30, 60].map(fps => (
                      <button
                        key={fps}
                        onClick={() => setFrameRate(fps)}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${frameRate === fps
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                          }`}
                      >
                        {fps} fps
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{t('zoom')} &mdash; {zoomLevel.toFixed(1)}x</p>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoomLevel}
                    onChange={e => setZoomLevel(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>1x</span><span>2x</span><span>3x</span>
                  </div>
                </div>

                {/* Mirror */}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Ayna Modu</p>
                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    className={`w-12 h-6 rounded-full transition-colors flex items-center ${isMirrored ? 'bg-primary justify-end' : 'bg-surface-variant justify-start'
                      } px-0.5`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow"></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className="w-full mt-4 bg-primary text-on-primary font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            {t('save')}
          </button>
        </div>
      )}




      {recordedVideoUrl && (
        <div className="fixed inset-0 z-[100] bg-surface-container-lowest/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 pb-8 overflow-y-auto animate-in fade-in duration-300">

          {/* Header */}
          <div className="w-full pt-4 pb-6 flex justify-center shrink-0">
            <div className="bg-surface-container-high/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              <span className="text-white font-bold tracking-wide text-[14px] uppercase">{t('saved')}</span>
            </div>
          </div>

          {/* Video Player */}
          <div className="w-full max-w-[280px] sm:max-w-sm relative group shrink-0 mx-auto my-2">
            {/* Arka plan parlama efekti */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-tertiary/30 blur-2xl opacity-50 rounded-[40px] -z-10 transition-opacity duration-500 group-hover:opacity-70"></div>

            <div className="rounded-[32px] overflow-hidden border-4 border-surface-container-high shadow-2xl relative bg-black aspect-[9/16] max-h-[55vh] flex items-center justify-center">
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
          <div className="h-12 mt-4 mb-2 flex items-center justify-center shrink-0">
            {saveStatus && (
              <div className={`px-5 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2 ${saveStatus === 'saving' ? 'bg-surface-variant text-on-surface-variant' :
                  saveStatus === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                {saveStatus === 'saving' && <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>}
                {saveStatus === 'ok' && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                {saveStatus === 'error' && <span className="material-symbols-outlined text-[16px]">error</span>}
                {saveStatus === 'saving' ? t('saving') :
                  saveStatus === 'ok' ? t('saveSuccess') :
                    t('saveError')}
              </div>
            )}
          </div>

          {/* Aksiyon Butonları */}
          <div className="w-full max-w-[280px] sm:max-w-sm flex flex-col gap-3 shrink-0 pb-safe">
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
                          } catch (err) { reject(err); }
                        };
                        reader.onerror = reject;
                      });
                      setSaveStatus('ok');
                    } catch (e) {
                      console.error('Save error:', e);
                      setSaveStatus('error');
                    }
                  }}
                  className="btn-shimmer w-full text-white font-bold text-[16px] py-4 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

                <div className="mt-1">
                  <button
                    disabled={saveStatus === 'saving'}
                    onClick={() => {
                      setRecordedVideoUrl(null);
                      setSaveStatus(null);
                      setSavedFileName(null);
                      recordedChunksRef.current = [];
                    }}
                    className="w-full bg-white/5 text-white/70 font-bold text-[15px] py-4 rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all border border-white/5 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    {t('deleteAndRetake')}
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
                    } catch (e) { console.error('Share error', e); }
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
