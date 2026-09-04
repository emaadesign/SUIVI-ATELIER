import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NouveauMotDePasse() {
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [chargement, setChargement] = useState(false)

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')

    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractÃ¨res.')
      return
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    setChargement(true)
    const { error } = await supabase.auth.updateUser({ password: motDePasse })
    setChargement(false)

    if (error) {
      setErreur("Impossible de mettre Ã  jour le mot de passe. Redemande un nouveau lien depuis l'Ã©cran de connexion.")
    } else {
      setSucces(true)
    }
  }

  if (succes) {
    return (
      <div className="min-h-screen flex flex-col justify-center px-6 bg-linen text-center">
        <div className="text-4xl mb-2">âœ…</div>
        <h1 className="font-display text-2xl text-plum mb-2">Mot de passe mis Ã  jour</h1>
        <p className="text-plum/60 mb-6">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <button className="btn-primary" onClick={() => (window.location.href = '/')}>
          Aller Ã  la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-linen">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">ðŸ”‘</div>
        <h1 className="font-display text-2xl text-plum">Nouveau mot de passe</h1>
        <p className="text-plum/60 mt-1">Choisis ton nouveau mot de passe</p>
      </div>
      <form onSubmit={valider} className="card space-y-3">
        <input
          className="input"
          type="password"
          placeholder="Nouveau mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Confirme le mot de passe"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          required
        />
        {erreur && <p className="text-clay text-sm">{erreur}</p>}
        <button className="btn-primary w-full" disabled={chargement}>
          {chargement ? 'Mise Ã  jour...' : 'Valider le nouveau mot de passe'}
        </button>
      </form>
    </div>
  )
}
