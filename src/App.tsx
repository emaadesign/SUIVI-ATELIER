import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ateliers from './pages/Ateliers'
import AtelierDetail from './pages/AtelierDetail'
import Participantes from './pages/Participantes'
import ParticipanteDetail from './pages/ParticipanteDetail'
import Stocks from './pages/Stocks'
import Calendrier from './pages/Calendrier'
import Messages from './pages/Messages'
import ImportBilletweb from './pages/ImportBilletweb'
import Export from './pages/Export'
import Parametres from './pages/Parametres'
import Plus from './pages/Plus'
import NouveauMotDePasse from './pages/NouveauMotDePasse'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [chargement, setChargement] = useState(true)
  const [modeRecuperation, setModeRecuperation] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChargement(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') setModeRecuperation(true)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  if (chargement) return <div className="min-h-screen bg-linen" />
  if (modeRecuperation) return <NouveauMotDePasse />
  if (!session) return <Login />

  return (
    <div className="min-h-screen bg-linen">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ateliers" element={<Ateliers />} />
        <Route path="/ateliers/:id" element={<AtelierDetail />} />
        <Route path="/participantes" element={<Participantes />} />
        <Route path="/participantes/:id" element={<ParticipanteDetail />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/calendrier" element={<Calendrier />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/import" element={<ImportBilletweb />} />
        <Route path="/export" element={<Export />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/plus" element={<Plus />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <NavBar />
    </div>
  )
}
