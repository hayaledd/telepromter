import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { ScriptProvider } from './context/ScriptContext'
import { LanguageProvider } from './context/LanguageContext'
import SplashScreen from './components/SplashScreen'
import MyScripts from './components/MyScripts'
import ScriptEditor from './components/ScriptEditor'
import ProfessionalRecord from './components/ProfessionalRecord'
import Recordings from './components/Recordings'

function App() {
  return (
    <LanguageProvider>
      <ScriptProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/scripts" element={<MyScripts />} />
            <Route path="/editor" element={<ScriptEditor />} />
            <Route path="/record" element={<ProfessionalRecord />} />
            <Route path="/recordings" element={<Recordings />} />
          </Routes>
        </Router>
      </ScriptProvider>
    </LanguageProvider>
  )
}

export default App
