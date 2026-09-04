import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import NavBar from './components/NavBar'
importer Login depuis './pages/Login'
importer le tableau de bord depuis './pages/Dashboard'
importer Ateliers depuis './pages/Ateliers'
import AtelierDetail from './pages/AtelierDetail'
importer les participants depuis './pages/Participantes'
import ParticipanteDetail from './pages/ParticipanteDetail'
importer les actions depuis './pages/Stocks'
importer le Calendrier depuis './pages/Calendrier'
importer les messages depuis './pages/Messages'
importer ImportBilletweb depuis './pages/ImportBilletweb'
importer Export depuis './pages/Export'
importer les paramètres depuis './pages/Paramètres'
importer Plus depuis './pages/Plus'
import NouveauMotDePasse from './pages/NouveauMotDePasse'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [chargement, setChargement] = useState(true)
  const [modeRecuperation, setModeRecuperation] = useState(false)

  utiliserEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      définirSession(données.session)
      définirChargement(faux)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      définirSession(session)
      si (événement === 'PASSWORD_RECOVERY') définirModeRecuperation(true)
    })
    retourner () => abonnement.abonnement.désabonnement()
  }, [])

  si (chargement) retourner <div className="min-h-screen bg-linen" />
  if (modeRecuperation) renvoie <NouveauMotDePasse />
  si (!session) retourner <Connexion />

  retour (
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
        <Route path="/paramètres" element={<Paramètres />} />
        <Route path="/plus" element={<Plus />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <NavBar />
    </div>
  )
}
