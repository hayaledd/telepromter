import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { Capacitor } from '@capacitor/core';
import MobileMenu from './MobileMenu';
import { useLanguage } from '../context/LanguageContext';

export default function ProfessionalRecord() {
  const navigate = useNavigate();
  const { getActiveScript, globalFontSize, setGlobalFontSize } = useScript();
  const { t } = useLanguage();
  const script = getActiveScript();

  useEffect(() => { if (!script) navigate('/scripts'); }, [script, navigate]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [savedVideoPath, setSavedVideoPath] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [layoutMode, setLayoutMode] = useState('full');
  const [showSettings, setShowSettings] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textWidth, setTextWidth] = useState('100%');
  const [prompterBg, setPrompterBg] = useState('none');
  const [facingMode, setFacingMode] = useState('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState('checking');

  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);
  const exactScrollRef = useRef(0);
  const smoothedDeltaRef = useRef(16.66);
  const wakeLockRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const timerDisplayRef = useRef(null);

  const TEXT_COLORS = [
    { id: 'white', value: '#ffffff', bg: 'bg-white' },
    { id: 'black', value: '#000000', bg: 'bg-black' },
    { id: 'yellow', value: '#facc15', bg: 'bg-yellow-400' },
    { id: 'green', value: '#4ade80', bg: 'bg-green-400' },
    { id: 'cyan', value: '#22d3ee', bg: 'bg-cyan-400' },
  ];

  const BG_COLORS = [
    { id: 'none', label: t('color_none'), value: 'transparent', preview: 'bg-transparent border-2 border-white/30' },
    { id: 'black', label: t('color_black'), value: 'rgba(0,0,0,0.85)', preview: 'bg-black' },
    { id: 'navy', label: t('color_navy'), value: 'rgba(10,15,50,0.90)', preview: 'bg-[#0a0f32]' },
    { id: 'dark', label: t('color_dark'), value: 'rgba(20,20,25,0.90)', preview: 'bg-[#141419]' },
  ];

  function formatTime(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // Wake Lock
  useEffect(() => {
    const acquireWakeLock = async () => {
      try {
        if ('wakeLock' in navigator)
          wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) { console.error('Wake Lock error:', err); }
    };
    if (isPlaying || isRecordingActive) acquireWakeLock();
    else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => { });
      wakeLockRef.current = null;
    }
  }, [isPlaying, isRecordingActive]);

  // Timer (no-rerender approach)
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        elapsedSecondsRef.current += 1;
        if (timerDisplayRef.current)
          timerDisplayRef.current.innerText = formatTime(elapsedSecondsRef.current);
      }, 1000);
    } else {
      elapsedSecondsRef.current = 0;
      if (timerDisplayRef.current) timerDisplayRef.current.innerText = formatTime(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // ── Kamera ve Mikrofon İzinlerini Kontrol Et ──
  useEffect(() => {
    let mounted = true;

    async function verifyPermissions() {
      try {
        let needsPrompt = true;
        try {
          if (navigator.permissions && navigator.permissions.query) {
            const camQuery = await navigator.permissions.query({ name: 'camera' });
            const micQuery = await navigator.permissions.query({ name: 'microphone' });
            if (camQuery.state === 'granted' && micQuery.state === 'granted') {
              needsPrompt = false;
            }
          }
        } catch (e) {
          console.warn("Permissions query not supported", e);
        }

        if (needsPrompt && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // İzin verilmişse doğrudan geçer, verilmemişse sorar
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          stream.getTracks().forEach(track => track.stop());
          // Donanım kaynağının serbest kalması için kısa bir süre bekle
          await new Promise(r => setTimeout(r, 300));
        }

        // Native Capacitor permission check
        if (CameraPreview && CameraPreview.requestPermissions) {
          const status = await CameraPreview.requestPermissions();
          if (status.camera !== 'granted') {
            throw new Error(t('permissionDeniedMsg') || "Kamera izni verilmedi.");
          }
        }

        if (mounted) {
          setPermissionError(null);
        }
      } catch (err) {
        console.error("Permission verification failed:", err);
        if (mounted) {
          setPermissionError(
            t('permissionDeniedMsg') || 
            "Kamera veya mikrofon izinleri verilmedi. Video kaydı yapabilmek için lütfen ayarlardan izinleri açın."
          );
        }
      }
    }

    verifyPermissions();

    return () => {
      mounted = false;
    };
  }, [t]);

  // Native Camera Setup — body must be transparent so native layer shows through WebView
  useEffect(() => {
    let mounted = true;

    // Make body transparent while on this screen
    document.body.classList.add('native-cam-active');

    async function startNativeCamera() {
      if (permissionError !== null) {
        if (mounted) setCameraReady(false);
        return;
      }

      if (layoutMode === 'prompter-only') {
        try { await CameraPreview.stop(); } catch (_) { }
        if (mounted) setCameraReady(false);
        return;
      }

      try {
        // İzinler zaten verifyPermissions ile kontrol edildi
        if (!mounted) return;

        // ── Step 2: Stop any existing camera session ──
        try { await CameraPreview.stop(); } catch (_) { }
        await new Promise(r => setTimeout(r, 300));
        if (!mounted) return;

        // ── Step 3: Start native camera ──
        await CameraPreview.start({
          parent: "cameraPreview",
          position: facingMode,   // 'front' | 'rear'
          toBack: true,           // render BEHIND the WebView
          width: window.screen.width,
          height: window.screen.height,
          x: 0,
          y: 0,
          storeToFile: false,
          disableAudio: false,
        });
        if (mounted) setCameraReady(true);
      } catch (e) {
        console.error('CameraPreview.start error:', e);
        if (mounted) setCameraReady(false);
      }
    }

    startNativeCamera();

    return () => {
      mounted = false;
      document.body.classList.remove('native-cam-active');
      // Arka planda donanımın kilitli kalmaması için hem kaydı hem kamerayı zorla kapatıyoruz
      (async () => {
        try { await CameraPreview.stopRecordVideo(); } catch (e) {}
        try { await CameraPreview.stop(); } catch (e) {}
      })();
      setCameraReady(false);
    };
  }, [facingMode, layoutMode, permissionError]);

  // Flip = change facingMode state → useEffect above restarts camera
  const flipCamera = () => {
    setFacingMode(prev => prev === 'front' ? 'rear' : 'front');
  };

  // Countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      startActualRecording();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function startActualRecording() {
    try {
      await CameraPreview.startRecordVideo({
        cameraDirection: facingMode,
        quality: 2,          // 0=low 1=medium 2=high (number) - Set to 2 for High Quality
        withFlash: false,
      });
      setIsRecordingActive(true);
      setIsPlaying(true);
    } catch (e) {
      console.error('startRecordVideo error:', e);
      alert('Kayıt başlatılamadı: ' + (e?.message || String(e)));
    }
  }

  const toggleReading = () => {
    if (isRecordingActive) return;
    setIsPlaying(prev => !prev);
  };

  const toggleRecording = async () => {
    if (layoutMode === 'prompter-only') {
      alert(t('prompterOnlyNoRecord') || 'Prompter modunda video kaydedilemez.');
      return;
    }

    if (!isRecordingActive) {
      if (isPlaying) setIsPlaying(false);
      // Permissions already requested at screen mount — start countdown immediately
      setCountdown(countdownDuration);
    } else {
      try {
        const result = await CameraPreview.stopRecordVideo();
        setIsRecordingActive(false);
        setIsPlaying(false);
        // Log full result so we can debug path issues
        console.log('stopRecordVideo result:', JSON.stringify(result));
        // Plugin returns different property names across versions
        const videoPath = result?.videoFilePath || result?.filePath || result?.path || result?.uri || null;
        if (videoPath) {
          try {
            // Android CameraPreview saves to cache. We MUST copy it to Documents for Recordings.jsx to see it.
            const now = new Date();
            const dateStr = `${String(now.getDate()).padStart(2, '0')}_${String(now.getMonth() + 1).padStart(2, '0')}_${now.getFullYear()}`;
            // Use HHMMSS to guarantee unique filename and avoid MediaStore ghost file collisions
            const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
            const fileName = `${dateStr}-${timeStr}.mp4`;
            
            let normalizedPath = videoPath;
            if (!normalizedPath.startsWith('file://') && normalizedPath.startsWith('/')) {
                normalizedPath = 'file://' + normalizedPath;
            }
            
            await Filesystem.copy({
              from: normalizedPath,
              to: fileName,
              toDirectory: Directory.Documents
            });
            
            const newStat = await Filesystem.stat({
               path: fileName,
               directory: Directory.Documents
            });
            setSavedVideoPath(newStat.uri);
          } catch(copyErr) {
            console.error('Copy to Documents failed:', copyErr);
            alert("Video kaydedilemedi! Lütfen bu mesajı yazılımcıya iletin: HATA: " + (copyErr.message || JSON.stringify(copyErr)) + " | YOL: " + videoPath);
            setSavedVideoPath(videoPath); // fallback
          }
        } else {
          // Fallback if no path returned
          setSavedVideoPath('gallery');
        }
      } catch (e) {
        console.error('stopRecordVideo error:', e);
        setIsRecordingActive(false);
        setIsPlaying(false);
        alert('Kayıt durdurulamadı: ' + (e?.message || String(e)));
      }
    }
  };

  const adjustSpeed = (delta) => setSpeed(prev => Math.max(0.5, Math.min(10, prev + (delta * 0.5))));

  const getReadTime = () => {
    if (!script) return '';
    const wpm = speed * 30;
    const words = script.content.trim().split(/\s+/).filter(Boolean).length;
    const totalSecs = Math.round((words / wpm) * 60);
    if (totalSecs < 60) return `~${totalSecs}sn`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs > 0 ? `~${mins}dk ${secs}sn` : `~${mins}dk`;
  };

  // Scroll Engine
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      exactScrollRef.current = scrollContainerRef.current.scrollTop;
      smoothedDeltaRef.current = 16.66;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      const scrollLoop = (time) => {
        const rawDelta = time - lastTime;
        lastTime = time;
        if (rawDelta > 100) { animationRef.current = requestAnimationFrame(scrollLoop); return; }
        smoothedDeltaRef.current = smoothedDeltaRef.current * 0.9 + rawDelta * 0.1;
        if (scrollContainerRef.current && speed > 0) {
          const px = (speed * 0.05) * smoothedDeltaRef.current;
          const cur = scrollContainerRef.current.scrollTop;
          if (Math.abs(cur - exactScrollRef.current) > 2) exactScrollRef.current = cur;
          exactScrollRef.current += px;
          scrollContainerRef.current.scrollTop = exactScrollRef.current;
        }
        animationRef.current = requestAnimationFrame(scrollLoop);
      };
      animationRef.current = requestAnimationFrame(scrollLoop);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, speed]);

  if (!script) return null;
  const scriptLines = script.content.split('\n').filter(l => l.trim() !== '');

  // prompter-only modunda kamera yok → saydam seçimi beyaz ekrana yol açar, koyu fallback kullan
  const bgValue = layoutMode === 'prompter-only' && prompterBg === 'none'
    ? 'rgba(15,15,20,1)'
    : prompterBg === 'none' ? 'transparent' : BG_COLORS.find(b => b.id === prompterBg)?.value || 'transparent';

  const rootBg = layoutMode === 'prompter-only' ? '#0f0f14' : 'transparent';

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden text-white font-sans" style={{ background: rootBg }}>
      <div id="cameraPreview" className="absolute inset-0 pointer-events-none z-0"></div>

      {/* HUD */}
      <div className="fixed top-0 left-0 w-full z-40 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10">
            <span className="flex h-3 w-3 relative">
              {isRecordingActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>}
              {isPlaying && !isRecordingActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRecordingActive ? 'bg-rose-500' : isPlaying ? 'bg-indigo-500' : 'bg-white/30'}`}></span>
            </span>
            <span className={`font-bold text-[12px] tracking-widest uppercase ${isRecordingActive ? 'text-rose-400' : isPlaying ? 'text-indigo-400' : 'text-white/40'}`}>
              {isRecordingActive ? t('recording') : isPlaying ? (t('reading') || 'OKUNUYOR') : t('ready')}
            </span>
            <span ref={timerDisplayRef} className="font-mono text-white ml-1 tabular-nums text-[13px]">{formatTime(0)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={flipCamera} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xl rounded-full px-3 py-2 border border-white/10">
            <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-1.5 backdrop-blur-xl rounded-full px-3 py-2 border border-white/10 ${showSettings ? 'bg-indigo-500' : 'bg-black/40'}`}>
            <span className="material-symbols-outlined text-[16px]">settings</span>
          </button>
        </div>
      </div>

      {/* Teleprompter Text Overlay */}
      <div
        className={`absolute z-10 flex flex-col items-center overflow-hidden ${layoutMode === 'bottom' ? 'bottom-[72px] left-0 right-0 h-[45vh]' : 'inset-0'}`}
        style={{ backgroundColor: bgValue }}
      >
        <div
          ref={scrollContainerRef}
          className={`absolute inset-0 w-full h-full px-6 overflow-y-auto overscroll-none touch-pan-y space-y-10 text-center pb-[85vh] ${layoutMode === 'bottom' ? 'pt-[40vh]' : 'pt-[80vh]'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', transform: 'translateZ(0)', willChange: 'scroll-position' }}
        >
          <div style={{ transform: 'translateZ(0)', willChange: 'transform', pointerEvents: isPlaying ? 'none' : 'auto' }}>
            {scriptLines.map((line, idx) => (
              <p key={idx} className="font-bold" style={{ fontSize: `${globalFontSize}px`, lineHeight: 1.4, color: textColor, maxWidth: textWidth, margin: '0 auto' }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Speed Control */}
      <div className="fixed bottom-[100px] right-4 z-40">
        <div className="bg-transparent py-3 px-1 flex flex-col items-center gap-2">
          <button onClick={() => adjustSpeed(1)} className="w-7 h-10 flex items-center justify-center text-indigo-400 hover:text-indigo-300 rounded-xl active:scale-95">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <span className="font-black text-indigo-400 text-[14px]">{speed / 5}x</span>
          <button onClick={() => adjustSpeed(-1)} className="w-7 h-10 flex items-center justify-center text-indigo-400 hover:text-indigo-300 rounded-xl active:scale-95">
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
          <div className="border-t border-indigo-500/20 pt-2 w-full flex justify-center">
            <span className="text-[10px] text-indigo-400 font-bold">{getReadTime()}</span>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-black/70 backdrop-blur-2xl h-[72px] flex items-center justify-between px-6 z-50 border-t border-white/5">
        {/* Left: Layout */}
        <div className="relative flex flex-col items-center gap-1">
          {showLayoutMenu && (
            <div className="absolute bottom-[100%] left-0 mb-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl z-[70] min-w-[140px]">
              {[
                { id: 'full', icon: 'fullscreen', label: t('fullScreen') },
                { id: 'bottom', icon: 'splitscreen', label: t('camBottom') },
                { id: 'prompter-only', icon: 'tv', label: t('prompterOnly') },
              ].map(opt => (
                <button key={opt.id} onClick={() => { setLayoutMode(opt.id); setShowLayoutMenu(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold ${layoutMode === opt.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-white hover:bg-white/10'}`}>
                  <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>{opt.label}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setShowLayoutMenu(!showLayoutMenu)} className={`w-12 h-12 rounded-full flex items-center justify-center ${showLayoutMenu ? 'bg-indigo-500 text-white' : 'text-white/70'}`}>
            <span className="material-symbols-outlined text-[24px]">
              {layoutMode === 'full' ? 'fullscreen' : layoutMode === 'prompter-only' ? 'tv' : 'splitscreen'}
            </span>
          </button>
          <span className="text-[9px] text-white/40 uppercase font-bold">{t('viewMode')}</span>
        </div>

        {/* Center: Play + Record */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <button onClick={toggleReading} disabled={isRecordingActive}
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center border-[3px] active:scale-95 transition-all ${isPlaying && !isRecordingActive ? 'bg-black border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-black/60 border-white/10'} ${isRecordingActive ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className={`material-symbols-outlined text-[28px] ${isPlaying && !isRecordingActive ? 'text-indigo-400' : 'text-white'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {(isPlaying && !isRecordingActive) ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <span className="text-[9px] uppercase font-bold text-white/60">{(isPlaying && !isRecordingActive) ? t('stop') : t('read')}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={toggleRecording} disabled={isPlaying && !isRecordingActive}
              className={`w-[60px] h-[60px] rounded-full flex items-center justify-center border-[3px] active:scale-95 transition-all ${isRecordingActive ? 'bg-black border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]' : 'bg-black/60 border-white/10'} ${(isPlaying && !isRecordingActive) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className={`transition-all ${isRecordingActive ? 'w-5 h-5 rounded-md bg-rose-500 animate-pulse' : 'w-7 h-7 rounded-full bg-rose-500'}`}></div>
            </button>
            <span className={`text-[9px] uppercase font-bold ${isRecordingActive ? 'text-rose-400' : 'text-white/60'}`}>
              {isRecordingActive ? t('stop') : t('record')}
            </span>
          </div>
        </div>

        {/* Right: Font Size */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center bg-white/10 rounded-full h-12 px-1 gap-0.5 border border-white/5">
            <button onClick={() => setGlobalFontSize(prev => Math.max(16, prev - 4))} className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95">
              <span className="material-symbols-outlined text-[16px]">text_decrease</span>
            </button>
            <button onClick={() => setGlobalFontSize(prev => Math.min(96, prev + 4))} className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95">
              <span className="material-symbols-outlined text-[20px]">text_increase</span>
            </button>
          </div>
          <span className="text-[9px] text-white/40 uppercase font-bold">{t('size')}</span>
        </div>
      </div>

      {/* Countdown */}
      {countdown !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <span className="text-[120px] font-black text-white leading-none animate-pulse">{countdown}</span>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-[72px] right-4 z-[60] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[220px] max-h-[calc(100vh-100px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-[12px] text-indigo-400 uppercase tracking-widest">{t('videoSettings')}</span>
            <button onClick={() => setShowSettings(false)}><span className="material-symbols-outlined text-[18px] text-white/50">close</span></button>
          </div>

          <div className="mb-4">
            <p className="text-[11px] text-white/50 uppercase tracking-widest mb-2 font-bold">{t('textColor')}</p>
            <div className="flex gap-2">
              {TEXT_COLORS.map(c => (
                <button key={c.id} onClick={() => setTextColor(c.value)} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform ${textColor === c.value ? 'border-indigo-500 scale-110' : 'border-transparent'}`}>
                  <span className={`w-6 h-6 rounded-full ${c.bg}`}></span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] text-white/50 uppercase tracking-widest mb-2 font-bold">{t('bgColor')}</p>
            <div className="grid grid-cols-4 gap-2">
              {BG_COLORS.map(b => (
                <button key={b.id} onClick={() => setPrompterBg(b.id)} className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 ${prompterBg === b.id ? 'border-indigo-500' : 'border-transparent'}`}>
                  <span className={`w-8 h-8 rounded-lg ${b.preview}`}></span>
                  <span className="text-[9px] text-white/50 font-bold">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] text-white/50 uppercase tracking-widest mb-2 font-bold">{t('eyeContact')}</p>
            <div className="flex gap-2">
              {[{ label: t('width_wide'), val: '100%' }, { label: t('width_medium'), val: '75%' }, { label: t('width_narrow'), val: '50%' }].map(opt => (
                <button key={opt.val} onClick={() => setTextWidth(opt.val)} className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${textWidth === opt.val ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/5 border-white/10 text-white/60'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] text-white/50 uppercase tracking-widest mb-2 font-bold">{t('countdown')}</p>
            <div className="flex gap-2">
              {[3, 5, 10].map(sec => (
                <button key={sec} onClick={() => setCountdownDuration(sec)} className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-all ${countdownDuration === sec ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/5 border-white/10 text-white/60'}`}>
                  {sec}s
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Post-Recording: Share/Save */}
      {savedVideoPath && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 gap-4">
          <div className="bg-white/10 px-6 py-2 rounded-full border border-white/10 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-green-400 text-[18px]">verified</span>
            <span className="text-white font-bold text-[14px] uppercase">{t('saved')}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-white/40 text-[16px]">photo_library</span>
            <span className="text-white/50 text-[12px]">
              {savedVideoPath === 'gallery'
                ? (t('savedToGallery') || 'Video galerinize kaydedildi')
                : savedVideoPath.split('/').pop()}
            </span>
          </div>
          <div className="w-full max-w-xs flex flex-col gap-3">
            {savedVideoPath !== 'gallery' && (
              <button
                onClick={async () => {
                  try {
                    await Share.share({
                      title: 'ScriptFlow Recording',
                      text: t('recordedWith'),
                      url: savedVideoPath,
                      dialogTitle: t('shareVideoTitle'),
                    });
                  } catch (e) { console.error('Share error', e); }
                }}
                className="w-full bg-indigo-500 text-white font-bold text-[16px] py-4 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                {t('share')}
              </button>
            )}

            <button
              onClick={() => setSavedVideoPath(null)}
              className="w-full bg-white/10 text-white font-bold text-[16px] py-4 rounded-2xl active:scale-[0.98] border border-white/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">videocam</span>
              {t('newRecording')}
            </button>

            <button
              onClick={() => navigate('/recordings')}
              className="w-full bg-white/5 text-white/70 font-bold text-[16px] py-4 rounded-2xl active:scale-[0.98] border border-transparent hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">video_library</span>
              {t('myVideos') || 'Kayıtlarım'}
            </button>
          </div>
        </div>
      )}

      {permissionError && permissionError !== 'checking' && (
        <div className="fixed inset-0 z-[1000] bg-[#0f0f14]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[40px] text-indigo-400">videocam_off</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-3">İzinler Gerekli</h2>
          <p className="text-white/60 text-[14px] max-w-xs mb-8 leading-relaxed">
            {permissionError}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={async () => {
                // Tekrar izin istemeyi dene
                try {
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                    stream.getTracks().forEach(t => t.stop());
                    setPermissionError(null);
                  }
                } catch (e) {
                  alert(t('pleaseOpenSettings') || "İzin pencereleri açılamadı. Lütfen telefon ayarlarından uygulamanın kamera ve mikrofon izinlerini manuel olarak etkinleştirin.");
                }
              }}
              className="w-full bg-indigo-500 text-white font-bold text-[16px] py-4 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">lock_open</span>
              Tekrar Dene / İzin Ver
            </button>
            <button
              onClick={() => navigate('/scripts')}
              className="w-full bg-white/5 text-white/70 font-bold text-[16px] py-4 rounded-2xl active:scale-[0.98] border border-white/10 flex items-center justify-center gap-2"
            >
              Geri Dön
            </button>
          </div>
        </div>
      )}

      <MobileMenu show={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
