import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Badge from '../components/Badge'

export default function Participantes() {
  const [inscriptions, setInscriptions] = useState<any[]>([])
  const [recherche, setRecherche] = useState('')
  const [filtrePhoto, setFiltrePhoto] = useState<'tous' | 'oui' | 'non'>('tous')
  const [filtrePelote, setFiltrePelote] = useState<'tous' | 'oui' | 'non'>('tous')

  useEffect(() => {
    supabase
      .from('inscriptions')
      .select('*, participantes(*), ateliers(date, types_ateliers(nom))')
      .neq('statut', 'Annulée')
      .order('created_at', { ascending: false })
      .then(({ data }) => setInscriptions(data ?? []))
  }, [])

  const filtrees = inscriptions.filter((i) => {
    const p = i.participantes
    const texte = `${p?.nom} ${p?.prenom} ${p?.email} ${p?.telephone} ${i.couleur_choisie}`.toLowerCase()
    if (recherche && !texte.includes(recherche.toLowerCase())) return false
    if (filtrePhoto !== 'tous' && Boolean(i.photo_autorisee) !== (filtrePhoto === 'oui')) return false
    if (filtrePelote !== 'tous' && Boolean(i.pelote_achetee) !== (filtrePelote === 'oui')) return false
    return true
  })

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Participantes</h1>
      <input
        className="input mb-3"
        placeholder="Rechercher (nom, email, couleur...)"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <select className="input w-auto text-sm" value={filtrePhoto} onChange={(e) => setFiltrePhoto(e.target.value as any)}>
          <option value="tous">Photo : toutes</option>
          <option value="oui">📸 Autorisée</option>
          <option value="non">📸 Interdite</option>
        </select>
        <select className="input w-auto text-sm" value={filtrePelote} onChange={(e) => setFiltrePelote(e.target.value as any)}>
          <option value="tous">Pelote : toutes</option>
          <option value="oui">✅ Achetée</option>
          <option value="non">☐ À acheter</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtrees.map((i) => (
          <Link to={`/participantes/${i.participante_id}`} key={i.id} className="card flex justify-between items-center">
            <div>
              <p className="font-semibold text-plum">{i.participantes?.prenom} {i.participantes?.nom}</p>
              <p className="text-plum/50 text-xs">{i.ateliers?.types_ateliers?.nom} · {new Date(i.ateliers?.date).toLocaleDateString('fr-FR')}</p>
            </div>
            <Badge tone={i.pelote_achetee ? 'ok' : 'bas'}>{i.pelote_achetee ? '✅' : '☐'}</Badge>
          </Link>
        ))}
        {filtrees.length === 0 && <p className="text-plum/50 text-sm">Aucune participante ne correspond.</p>}
      </div>
    </div>
  )
}
