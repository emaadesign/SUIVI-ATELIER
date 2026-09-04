import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  async function connecter(e: React.FormEvent) {
    e.preventDefault()
    setChargement(true)
    setErreur('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    if (error) setErreur('Email ou mot de passe incorrect.')
    setChargement(false)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-linen">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🧶</div>
        <h1 className="font-display text-3xl text-plum">Mes Ateliers</h1>
        <p className="text-plum/60 mt-1">Ton tableau de bord crochet</p>
      </div>
      <form onSubmit={connecter} className="card space-y-3">
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
        {erreur && <p className="text-clay text-sm">{erreur}</p>}
        <button className="btn-primary w-full" disabled={chargement}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
