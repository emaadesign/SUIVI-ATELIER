import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Badge from '../components/Badge'

export default function ParticipanteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [participante, setParticipante] = useState<any>(null)
  const [inscriptions, setInscriptions] = useState<any[]>([])
  const [reponses, setReponses] = useState<Record<string, any[]>>({})
  const [fidelite, setFidelite] = useState<any>(null)
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false)
  const [participationsHistoriques, setParticipationsHistoriques] = useState('0')

  useEffect(() => { charger() }, [id])

  async function charger() {
    const { data: p } = await supabase.from('participantes').select('*').eq('id', id).single()
    setParticipante(p)
    setParticipationsHistoriques(String(p?.participations_historiques ?? 0))

    const { data: f } = await supabase.from('v_fidelite_participantes').select('*').eq('participante_id', id).single()
    setFidelite(f)

    const { data: insc } = await supabase
      .from('inscriptions')
      .select('*, ateliers(date, heure_debut, types_ateliers(nom))')
      .eq('participante_id', id)
      .order('created_at', { ascending: false })
    setInscriptions(insc ?? [])

    const reponsesParInscription: Record<string, any[]> = {}
    for (const i of insc ?? []) {
      const { data: r } = await supabase.from('reponses_formulaire').select('*').eq('inscription_id', i.id)
      reponsesParInscription[i.id] = r ?? []
    }
    setReponses(reponsesParInscription)
  }

  async function togglePelote(inscriptionId: string, valeurActuelle: boolean) {
    await supabase.from('inscriptions').update({ pelote_achetee: !valeurActuelle }).eq('id', inscriptionId)
    charger()
  }

  async function sauvegarderParticipationsHistoriques() {
    await supabase.from('participantes').update({ participations_historiques: parseInt(participationsHistoriques, 10) || 0 }).eq('id', id)
    charger()
  }

  async function supprimerParticipante() {
    if (!confirm('Supprimer définitivement cette participante et toutes ses données ? Cette action est irréversible.')) return
    await supabase.from('participantes').update({ supprimee: true }).eq('id', id)
    navigate('/participantes')
  }

  if (!participante) return <div className="p-6">Chargement…</div>

  const ateliersRealises = inscriptions.filter((i) => i.statut === 'Présente')

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <Link to="/participantes" className="text-rose text-sm">← Participantes</Link>
      <h1 className="page-title mt-2">{participante.prenom} {participante.nom}</h1>
      <p className="text-plum/60 text-sm mb-4">{participante.email} {participante.telephone ? `· ${participante.telephone}` : ''}</p>

      <div className="card mb-4">
        <p className="font-semibold text-plum mb-2 text-sm">Fidelite</p>
        <p className="text-2xl font-display text-plum mb-2">{fidelite?.ateliers_realises ?? 0} <span className="text-sm text-plum/50">atelier(s) realise(s)</span></p>
        {fidelite?.premiere_participation && (
          <p className="text-xs text-plum/60">Premiere participation : {new Date(fidelite.premiere_participation).toLocaleDateString('fr-FR')}</p>
        )}
        {fidelite?.derniere_participation && (
          <p className="text-xs text-plum/60">Derniere participation : {new Date(fidelite.derniere_participation).toLocaleDateString('fr-FR')}</p>
        )}
        {fidelite?.nb_annulations > 0 && (
          <p className="text-xs text-plum/60">Annulations : {fidelite.nb_annulations}</p>
        )}

        <div className="border-t border-rose-light mt-3 pt-3">
          <label className="text-xs text-plum/60">Participations avant la mise en place de l'application</label>
          <div className="flex gap-2 mt-1">
            <input
              className="input"
              type="number"
              min={0}
              value={participationsHistoriques}
              onChange={(e) => setParticipationsHistoriques(e.target.value)}
            />
            <button className="btn-secondary text-sm" onClick={sauvegarderParticipationsHistoriques}>OK</button>
          </div>
        </div>

        {ateliersRealises.length > 0 && (
          <button className="text-rose text-sm font-semibold mt-3" onClick={() => setHistoriqueOuvert(!historiqueOuvert)}>
            {historiqueOuvert ? 'Masquer' : 'Voir'} l'historique des ateliers realises
          </button>
        )}
        {historiqueOuvert && (
          <div className="mt-2 space-y-1">
            {ateliersRealises.map((i) => (
              <p key={i.id} className="text-sm text-plum/80">
                {new Date(i.ateliers?.date).toLocaleDateString('fr-FR')} — {i.ateliers?.types_ateliers?.nom}
              </p>
            ))}
          </div>
        )}
      </div>

      {inscriptions.map((i) => (
        <div key={i.id} className="card mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-plum">{i.ateliers?.types_ateliers?.nom}</p>
              <p className="text-plum/60 text-sm">{new Date(i.ateliers?.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
            </div>
            <Badge tone={i.statut === 'Annulée' ? 'critique' : 'neutre'}>{i.statut}</Badge>
          </div>

          <div className="flex gap-2 flex-wrap text-xs mb-3">
            {i.couleur_choisie && <Badge>🎨 {i.couleur_choisie}</Badge>}
            {i.cookie_choisi && <Badge>🍪 {i.cookie_choisi}</Badge>}
            <Badge tone={i.photo_autorisee ? 'ok' : 'critique'}>{i.photo_autorisee ? '📸 Autorisée' : '📸 Interdite'}</Badge>
          </div>

          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={!!i.pelote_achetee} onChange={() => togglePelote(i.id, i.pelote_achetee)} />
            Pelote achetée
          </label>

          <div className="flex gap-3 text-xs text-plum/70 mb-3">
            <span>Rappel : {i.rappel_envoye ? '✅' : '❌'}</span>
            <span>Post-atelier : {i.message_post_atelier_envoye ? '✅' : '❌'}</span>
            <span>WhatsApp : {i.whatsapp_envoye ? '✅' : '❌'}</span>
          </div>

          {reponses[i.id]?.length > 0 && (
            <div className="border-t border-rose-light pt-3">
              <p className="font-semibold text-plum text-sm mb-1">Informations du formulaire</p>
              {reponses[i.id].map((r) => (
                <p key={r.id} className="text-sm text-plum/80">
                  <span className="text-plum/50">{r.question} : </span>{r.reponse}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}

      <button onClick={supprimerParticipante} className="text-clay text-sm font-semibold mt-2">
        🗑 Supprimer cette participante
      </button>
    </div>
  )
}
