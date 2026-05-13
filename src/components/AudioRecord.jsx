import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScript } from '../context/ScriptContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useLanguage } from '../context/LanguageContext';

export default function AudioRecord() {
  const navigate = useNavigate();
  const { getActiveScript, globalFontSize, setGlobalFontSize } = useScript();
  const { t } = useLanguage();
  const script = getActiveScript();

  useEffect(() => {
    if (!script) {
      navigate('/scripts');
    }
  }, [script, navigate]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedMimeType, setRecordedMimeType] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const elapsedSecondsRef = useRef(0);
  const timerDisplayRef = useRef(null);

  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);
  const exactScrollRef = useRef(0);
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
      wakeLockRef.current.release().catch(()=>{});
      wakeLockRef.current = null;
    }
  }, [isPlaying, isRecordingActive]);

  function formatTime(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        elapsedSecondsRef.current += 1;
        if (timerDisplayRef.current) {
          timerDisplayRef.current.innerText = formatTime(elapsedSecondsRef.current);
        }
      }, 1000);
    } else {
      elapsedSecondsRef.current = 0;
      if (timerDisplayRef.current) {
        timerDisplayRef.current.innerText = formatTime(0);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getSupportedAudioMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const toggleRecording = () => {
    if (!isRecordingActive) {
      if (isPlaying) setIsPlaying(false);
      setCountdown(3);
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingActive(false);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      if (mediaStreamRef.current) {
        try {
          recordedChunksRef.current = [];
          const mimeType = getSupportedAudioMimeType();
          if (!mimeType) {
            console.error('No supported audio MIME type');
            setSaveStatus('error');
            return;
          }
          setRecordedMimeType(mimeType);

          const mediaRecorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
          };
          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            setRecordedAudioUrl(URL.createObjectURL(blob));
          };
          mediaRecorder.start(1000);
        } catch (e) {
          console.error(e);
          setSaveStatus('error');
        }
      }
      setIsRecordingActive(true);
      setIsPlaying(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const adjustSpeed = (delta) => setSpeed(prev => Math.max(1, Math.min(10, prev + delta)));

  useEffect(() => {
    let cancelled = false;
    async function setupAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        mediaStreamRef.current = stream;
      } catch (err) {
        console.error('Mic access failed:', err);
      }
    }
    setupAudio();
    return () => {
      cancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Bluetooth / Keyboard Remote Support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case ' ':
        case 'Enter':
        case 'MediaPlayPause':
          e.preventDefault();
          if (!isRecordingActive) setIsPlaying(!isPlaying);
          break;
        case 'ArrowUp':
        case 'PageUp':
        case '+':
          e.preventDefault();
          adjustSpeed(1);
          break;
        case 'ArrowDown':
        case 'PageDown':
        case '-':
          e.preventDefault();
          adjustSpeed(-1);
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

  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      exactScrollRef.current = scrollContainerRef.current.scrollTop;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      const scrollLoop = (time) => {
        const deltaTime = Math.min(time - lastTime, 50);
        lastTime = time;
        if (scrollContainerRef.current && speed > 0) {
          const pixelsPerFrame = (speed * 0.05) * deltaTime;
          
          const currentScroll = scrollContainerRef.current.scrollTop;
          if (Math.abs(currentScroll - exactScrollRef.current) > 2) {
            exactScrollRef.current = currentScroll;
          }

          exactScrollRef.current += pixelsPerFrame;
          scrollContainerRef.current.scrollTop = exactScrollRef.current;
        }
        animationRef.current = requestAnimationFrame(scrollLoop);
      };
      animationRef.current = requestAnimationFrame(scrollLoop);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speed]);

  if (!script) return null;
  const scriptLines = script.content.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="bg-[#0f0f14] text-white fixed inset-0 h-[100dvh] w-screen overflow-hidden overscroll-none flex flex-col font-sans">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className={`w-[80vw] h-[80vw] bg-indigo-600/10 rounded-full blur-[100px] transition-all duration-700 ${isRecordingActive ? 'scale-150 opacity-100 animate-pulse' : 'scale-100 opacity-50'}`} />
        <div className={`absolute w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[80px] transition-all duration-700 delay-100 ${isRecordingActive ? 'scale-125 opacity-100 animate-ping' : 'scale-100 opacity-30'}`} style={{ animationDuration: '3s' }} />
      </div>

      {/* Top HUD */}
      <div className="relative z-40 p-5 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="pointer-events-auto w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>
          <div className="flex items-center gap-2 pointer-events-auto bg-white/5 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10">
            <span className="flex h-3 w-3 relative">
            {isRecordingActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isRecordingActive ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : isPlaying ? 'bg-indigo-500' : 'bg-white/30'}`}></span>
          </span>
          <span className={`font-bold text-[12px] tracking-widest uppercase ${isRecordingActive ? 'text-rose-400' : isPlaying ? 'text-indigo-400' : 'text-white/40'}`}>
            {isRecordingActive ? 'SES KAYDI' : isPlaying ? 'OKUNUYOR' : 'HAZIR'}
          </span>
          <span ref={timerDisplayRef} className="font-mono text-white/90 ml-2 text-[13px]">{formatTime(elapsedSecondsRef.current)}</span>
          </div>
        </div>
      </div>

      {/* Teleprompter Area */}
      <div className="flex-1 w-full relative z-10">
        <div ref={scrollContainerRef} className="absolute inset-0 w-full h-full px-6 overflow-y-auto overscroll-none touch-pan-y space-y-12 text-center pb-[60vh] pt-[30vh]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', transform: 'translateZ(0)', willChange: 'scroll-position, transform' }}>
          {scriptLines.map((line, idx) => (
            <p key={idx} className="font-bold text-white/90" style={{ fontSize: `${globalFontSize}px`, lineHeight: 1.4, willChange: 'transform' }}>
              {line}
            </p>
          ))}
        </div>
        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-[#0f0f14] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#0f0f14] to-transparent z-10 pointer-events-none"></div>
        
        {/* Floating Speed Control */}
        <div className="fixed bottom-[120px] right-4 w-auto z-40">
          <div className="bg-[#1a1a24]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl py-3 px-1 flex flex-col items-center gap-2">
            <button onClick={() => adjustSpeed(1)} className="w-7 h-10 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[20px] font-bold">add</span>
            </button>
            <div className="flex flex-col items-center justify-center py-1">
              <span className="font-black text-indigo-400 text-[14px] leading-none">{speed / 5}x</span>
            </div>
            <button onClick={() => adjustSpeed(-1)} className="w-7 h-10 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[20px] font-bold">remove</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-50 w-full bg-[#0f0f14]/90 backdrop-blur-2xl h-[100px] flex items-center justify-between px-6 border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {/* Left Actions */}
        <div className="flex items-center gap-3 w-[80px]">
          <div className="flex items-center bg-white/5 rounded-full px-1 border border-white/5">
            <button onClick={() => setGlobalFontSize(prev => Math.max(16, prev - 4))} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white">
              <span className="material-symbols-outlined text-[18px]">text_decrease</span>
            </button>
            <button onClick={() => setGlobalFontSize(prev => Math.min(96, prev + 4))} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white">
              <span className="material-symbols-outlined text-[20px]">text_increase</span>
            </button>
          </div>
        </div>
        
        {/* Record Button */}
        <div className="flex items-center justify-center">
           <button 
             onClick={toggleRecording} 
             className={`w-[60px] h-[60px] rounded-full flex items-center justify-center border-[3px] active:scale-95 transition-all duration-300 ${
               isRecordingActive 
                 ? 'bg-[#1a1a24] border-white/10 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]' 
                 : 'bg-[#1a1a24] border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:border-indigo-400'
             }`}
           >
             <div className={`transition-all duration-300 ${
               isRecordingActive 
                 ? 'w-5 h-5 rounded-md bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
                 : 'w-7 h-7 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
             }`}></div>
           </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end w-[80px]">
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0f0f14]/80 backdrop-blur-md">
          <span className="text-[120px] font-black text-indigo-400 drop-shadow-[0_0_40px_rgba(99,102,241,0.5)] animate-pulse">{countdown}</span>
          <span className="text-white/60 font-bold tracking-widest mt-4">HAZIRLAN...</span>
        </div>
      )}

      {/* Audio Save Modal */}
      {recordedAudioUrl && (
        <div className="fixed inset-0 z-[100] bg-[#0f0f14]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
             <span className="material-symbols-outlined text-[40px] text-indigo-400">mic_external_on</span>
          </div>
          <h2 className="text-white font-bold text-[22px] mb-2">Ses Kaydı Tamamlandı</h2>
          <p className="text-white/40 text-[13px] mb-8 text-center max-w-[250px]">Kayıt başarılı bir şekilde oluşturuldu. Dinleyebilir veya cihazına kaydedebilirsin.</p>
          
          <div className="w-full max-w-xs bg-white/5 rounded-2xl p-4 border border-white/10 mb-8">
            <audio src={recordedAudioUrl} controls className="w-full h-12" />
          </div>

          {saveStatus === 'error' && <p className="text-rose-400 text-sm mb-4">Kaydedilirken hata oluştu!</p>}
          {saveStatus === 'ok' && <p className="text-emerald-400 text-sm mb-4">Başarıyla kaydedildi!</p>}

          <div className="w-full max-w-xs flex flex-col gap-3">
            {!saveStatus || saveStatus === 'error' ? (
              <button 
                disabled={saveStatus === 'saving'}
                onClick={async () => {
                  setSaveStatus('saving');
                  try {
                    const res = await fetch(recordedAudioUrl);
                    const blob = await res.blob();
                    const ext = recordedMimeType.includes('mp4') ? 'm4a' : 'webm';
                    const fileName = `ScriptFlow_Recording_Audio_${Date.now()}.${ext}`;
                    
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = async () => {
                      await Filesystem.writeFile({
                        path: fileName,
                        data: reader.result,
                        directory: Directory.Documents
                      });
                      setSaveStatus('ok');
                    };
                  } catch(e) {
                    setSaveStatus('error');
                  }
                }}
                className="w-full bg-indigo-500 text-white font-bold py-4 rounded-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
              >
                {saveStatus === 'saving' ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">download</span>}
                Cihaza Kaydet
              </button>
            ) : (
               <button 
                onClick={() => navigate('/recordings')}
                className="w-full bg-indigo-500 text-white font-bold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">video_library</span>
                Kayıtlarıma Git
              </button>
            )}

            <button 
              disabled={saveStatus === 'saving'}
              onClick={() => {
                setRecordedAudioUrl(null);
                setSaveStatus(null);
                recordedChunksRef.current = [];
              }}
              className="w-full bg-white/5 text-white/60 font-bold py-4 rounded-xl active:scale-95 transition-all border border-white/5 hover:bg-white/10"
            >
              Sil ve Tekrar Çek
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
