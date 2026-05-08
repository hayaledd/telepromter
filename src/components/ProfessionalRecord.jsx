import React, { useState, useEffect, useRef } from 'react';
import { useScript } from '../context/ScriptContext';
import { useNavigate } from 'react-router-dom';
import { Filesystem, Directory } from '@capacitor/filesystem';

export default function ProfessionalRecord() {
  const navigate = useNavigate();
  const { getActiveScript, globalFontSize, setGlobalFontSize } = useScript();
  const script = getActiveScript();

  // If no script is active, redirect back to scripts list
  useEffect(() => {
    if (!script) {
      navigate('/scripts');
    }
  }, [script, navigate]);

  const [layoutMode, setLayoutMode] = useState('split-mode');
  
  // Teleprompter State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [isMirrored, setIsMirrored] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);
  
  // Recording Refs
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const toggleLayout = () => {
    setLayoutMode(prev => prev === 'split-mode' ? 'overlay-mode' : 'split-mode');
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      // START RECORDING
      if (mediaStreamRef.current) {
        try {
          recordedChunksRef.current = [];
          const mediaRecorder = new MediaRecorder(mediaStreamRef.current, { mimeType: 'video/webm' });
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedVideoUrl(url);
          };

          mediaRecorder.start();
        } catch (e) {
          console.error("MediaRecorder start failed:", e);
        }
      }
      setIsPlaying(true);
    } else {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsPlaying(false);
    }
  };

  const adjustSpeed = (delta) => {
    setSpeed(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  // Camera Setup
  useEffect(() => {
    let stream = null;
    async function setupCamera() {
      try {
        // Request both video and audio for recording
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
    <div className="bg-background text-on-background h-screen w-screen overflow-hidden flex flex-col font-body-md dark">
      {/* HUD Overlay */}
      <div className="fixed top-0 left-0 w-full z-40 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-2 bg-surface-container/30 backdrop-blur-xl shadow-sm rounded-full px-4 py-2 border border-white/10 pointer-events-auto bg-gradient-to-r from-surface-container/40 to-surface-container-high/40">
          <span className="flex h-3 w-3 relative">
            {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]' : 'bg-surface-variant'}`}></span>
          </span>
          <span className={`font-bold text-[12px] tracking-widest uppercase ${isPlaying ? 'text-error' : 'text-on-surface-variant'}`}>{isPlaying ? 'REC' : 'READY'}</span>
          <span className="font-body-md text-on-surface ml-1">{isPlaying ? '00:00:12' : '00:00:00'}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-container/30 backdrop-blur-xl shadow-sm rounded-full px-4 py-2 border border-white/10 pointer-events-auto bg-gradient-to-r from-surface-container/40 to-surface-container-high/40">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-[0_0_8px_rgba(173,198,255,0.8)]"></span>
          </span>
          <span className="font-bold text-primary text-[12px] tracking-widest uppercase">SYNC</span>
        </div>
      </div>

      <div className={`flex-1 w-full relative flex flex-col landscape:flex-row group ${layoutMode} mb-[72px] landscape:mb-0 landscape:mr-[72px]`} id="layout-container">
        {/* Camera Feed Area */}
        <div className="relative bg-surface-container-lowest w-full transition-all duration-300 group-[.split-mode]:flex-[3] group-[.split-mode]:landscape:flex-1 group-[.overlay-mode]:absolute group-[.overlay-mode]:inset-0 group-[.overlay-mode]:w-full group-[.overlay-mode]:h-full z-0">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain bg-black opacity-80" />
          {/* Grid overlay */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
            <div className="border-b border-r border-outline-variant"></div>
            <div className="border-b border-r border-outline-variant"></div>
            <div className="border-b border-outline-variant"></div>
            <div className="border-b border-r border-outline-variant"></div>
            <div className="border-b border-r border-outline-variant"></div>
            <div className="border-b border-outline-variant"></div>
            <div className="border-r border-outline-variant"></div>
            <div className="border-r border-outline-variant"></div>
            <div></div>
          </div>
        </div>

        {/* Teleprompter Area */}
        <div className="relative w-full flex flex-col items-center overflow-hidden transition-all duration-300 group-[.split-mode]:flex-[2] group-[.split-mode]:landscape:flex-1 group-[.split-mode]:border-t group-[.split-mode]:landscape:border-t-0 group-[.split-mode]:landscape:border-l border-white/5 group-[.split-mode]:bg-surface-dim/80 group-[.split-mode]:backdrop-blur-md group-[.overlay-mode]:absolute group-[.overlay-mode]:inset-0 group-[.overlay-mode]:w-full group-[.overlay-mode]:h-full group-[.overlay-mode]:bg-black/50 group-[.overlay-mode]:z-10">
          {/* Reading Line Indicator */}
          <div className="absolute top-1/3 w-full border-t border-primary/80 shadow-[0_0_10px_rgba(173,198,255,0.5)] z-20 pointer-events-none flex items-center justify-between px-2">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-primary/90 border-b-[6px] border-b-transparent drop-shadow-[0_0_4px_rgba(173,198,255,0.8)]"></div>
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[10px] border-r-primary/90 border-b-[6px] border-b-transparent drop-shadow-[0_0_4px_rgba(173,198,255,0.8)]"></div>
          </div>
          {/* Scrolling Text Container */}
          <div ref={scrollContainerRef} className="absolute inset-0 w-full h-full max-w-4xl mx-auto px-edge-margin-tablet pt-[40vh] pb-[60vh] overflow-y-auto space-y-12 text-center z-10 group-[.overlay-mode]:text-shadow-lg" style={{ scrollBehavior: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', transform: isMirrored ? 'scaleX(-1)' : 'none' }}>
            {scriptLines.map((line, idx) => (
              <p key={idx} className="font-prompter-display text-on-surface font-bold drop-shadow-md" style={{ fontSize: `${globalFontSize}px`, lineHeight: 1.4 }}>
                {line}
              </p>
            ))}
          </div>
          {/* Gradient fade masks */}
          <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-surface-dim via-surface-dim/80 to-transparent z-10 pointer-events-none group-[.overlay-mode]:hidden"></div>
          <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-surface-dim via-surface-dim/80 to-transparent z-10 pointer-events-none group-[.overlay-mode]:hidden"></div>
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
      <div className="fixed bottom-0 landscape:bottom-auto landscape:right-0 landscape:h-screen left-0 w-full landscape:w-control-bar-height bg-surface-container-lowest/80 backdrop-blur-2xl h-control-bar-height flex landscape:flex-col items-center justify-center px-4 landscape:py-4 z-50 border-t landscape:border-t-0 landscape:border-l border-white/5 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex landscape:flex-col items-center gap-6 w-full landscape:h-full max-w-2xl justify-between">
          {/* Left Actions */}
          <div className="flex landscape:flex-col gap-4">
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => setIsMirrored(!isMirrored)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMirrored ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-variant/50'}`}
              >
                <span className="material-symbols-outlined text-[24px]">flip</span>
              </button>
              <span className="text-[10px] text-outline uppercase font-bold tracking-tighter">Mirror</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button 
                className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors" 
                onClick={toggleLayout} 
                title="Toggle Layout"
              >
                <span className="material-symbols-outlined text-[24px]">layers</span>
              </button>
              <span className="text-[10px] text-outline uppercase font-bold tracking-tighter">Layouts</span>
            </div>
          </div>
          {/* Primary Record/Stop Action */}
          <div className="flex flex-col items-center relative -top-3 landscape:top-0 landscape:-left-3">
            <button onClick={togglePlayback} className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center border-[4px] border-surface-variant/80 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.5)] active:scale-95 transition-transform backdrop-blur-xl">
              <div className={`w-8 h-8 rounded-sm transition-all duration-300 ${isPlaying ? 'bg-gradient-to-br from-error to-error-container animate-pulse shadow-[0_0_16px_rgba(255,180,171,0.6)]' : 'bg-primary rounded-full'}`}></div>
            </button>
            <span className={`text-[10px] uppercase font-bold tracking-widest mt-2 drop-shadow-sm ${isPlaying ? 'text-error' : 'text-primary'}`}>{isPlaying ? 'Stop' : 'Start'}</span>
          </div>
          {/* Right Actions */}
          <div className="flex landscape:flex-col gap-4">
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => setGlobalFontSize(prev => prev >= 72 ? 24 : prev + 8)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[24px]">text_increase</span>
              </button>
              <span className="text-[10px] text-outline uppercase font-bold tracking-tighter">Text Size</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => navigate('/editor')} className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <span className="text-[10px] text-outline uppercase font-bold tracking-tighter">Close</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Overlay */}
      {recordedVideoUrl && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Review Recording</h2>
          
          <div className="w-full max-w-lg bg-surface-container rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-8 relative">
            <video src={recordedVideoUrl} controls className="w-full h-auto max-h-[60vh] object-contain bg-black"></video>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setRecordedVideoUrl(null);
                recordedChunksRef.current = [];
              }}
              className="px-6 py-3 rounded-full font-body-md text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              Discard & Retake
            </button>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch(recordedVideoUrl);
                  const blob = await response.blob();
                  const reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = async () => {
                    const base64data = reader.result;
                    await Filesystem.writeFile({
                      path: `ScriptFlow_Recording_${new Date().getTime()}.webm`,
                      data: base64data,
                      directory: Directory.Documents
                    });
                    alert("Video başarıyla Belgeler (Documents) klasörüne kaydedildi!");
                  };
                } catch (e) {
                  alert("Kayıt hatası: " + e);
                }
              }}
              className="bg-primary text-on-primary font-headline-md px-8 py-3 rounded-full hover:bg-primary-fixed transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">download</span>
              Save Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
