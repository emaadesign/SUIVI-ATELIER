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

  useEffect(() => { charger() }, [id])

  async function charger() {
    const { data: p } = await supabase.from('participantes').select('*').eq('id', id).single()
    setParticipante(p)

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

  async function supprimerParticipante() {
    if (!confirm('Supprimer définitivement cette participante et toutes ses données ? Cette action est irréversible.')) return
    await supabase.from('participantes').update({ supprimee: true }).eq('id', id)
    navigate('/participantes')
  }

  if (!participante) return <div className="p-6">Chargement…</div>

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <Link to="/participantes" className="text-rose text-sm">← Participantes</Link>
      <h1 className="page-title mt-2">{participante.prenom} {participante.nom}</h1>
      <p className="text-plum/60 text-sm mb-4">{participante.email} {participante.telephone ? `· ${participante.telephone}` : ''}</p>

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
