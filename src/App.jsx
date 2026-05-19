import React, { useEffect, useRef } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { ScriptProvider } from './context/ScriptContext'
import { LanguageProvider } from './context/LanguageContext'
import SplashScreen from './components/SplashScreen'
import MyScripts from './components/MyScripts'
import ScriptEditor from './components/ScriptEditor'
import ProfessionalRecord from './components/ProfessionalRecord'
import AudioRecord from './components/AudioRecord'
import Recordings from './components/Recordings'
import Tutorial from './components/Tutorial'

// Toast bileşeni
function Toast({ message, visible }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
        background: 'rgba(30,30,30,0.92)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '24px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 99999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {message}
    </div>
  )
}

// Geri tuşu yöneticisi — Router içinde çalışmalı
function BackButtonHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const backPressedOnce = useRef(false)
  const [toastVisible, setToastVisible] = React.useState(false)
  const toastTimer = useRef(null)

  useEffect(() => {
    const handler = CapacitorApp.addListener('backButton', () => {
      const isHome = location.pathname === '/scripts' || location.pathname === '/'

      if (isHome) {
        // Ana ekrandaysa: ilk basışta uyarı göster, ikinci basışta çık
        if (backPressedOnce.current) {
          CapacitorApp.exitApp()
        } else {
          backPressedOnce.current = true
          setToastVisible(true)

          clearTimeout(toastTimer.current)
          toastTimer.current = setTimeout(() => {
            backPressedOnce.current = false
            setToastVisible(false)
          }, 2000)
        }
      } else {
        // Başka sayfadaysa: bir önceki sayfaya dön
        navigate(-1)
      }
    })

    return () => {
      handler.then(h => h.remove())
      clearTimeout(toastTimer.current)
    }
  }, [location, navigate])

  return <Toast message="Çıkmak için tekrar basın" visible={toastVisible} />
}

function App() {
  useEffect(() => {
    // Uygulama ilk açıldığında Kamera ve Mikrofon izinlerini topluca iste
    const requestPermissions = async () => {
      try {
        if (CapacitorApp && navigator?.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach(t => t.stop()); // İzinleri aldıktan sonra donanımı hemen serbest bırak
        }
      } catch (e) {
        console.warn('Initial permissions not granted:', e);
      }
    };
    requestPermissions();
  }, []);

  return (
    <LanguageProvider>
      <ScriptProvider>
        <Router>
          <BackButtonHandler />
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/scripts" element={<MyScripts />} />
            <Route path="/editor" element={<ScriptEditor />} />
            <Route path="/record" element={<ProfessionalRecord />} />
            <Route path="/record-audio" element={<AudioRecord />} />
            <Route path="/recordings" element={<Recordings />} />
            <Route path="/tutorial" element={<Tutorial />} />
          </Routes>
        </Router>
      </ScriptProvider>
    </LanguageProvider>
  )
}

export default App
