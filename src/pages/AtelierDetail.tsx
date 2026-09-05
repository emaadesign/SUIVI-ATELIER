import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { confirmerDistribution, annulerReservationSansDistribution, libererReservation } from '../lib/stock'
import Badge from '../components/Badge'

export default function AtelierDetail() {
  const { id } = useParams()
  const [atelier, setAtelier] = useState<any>(null)
  const [inscriptions, setInscriptions] = useState<any[]>([])
  const [materiel, setMateriel] = useState<{ nom: string; quantite: number }[]>([])
  const [typesAteliers, setTypesAteliers] = useState<any[]>([])

  useEffect(() => { charger() }, [id])

  async function charger() {
    const { data: a } = await supabase.from('ateliers').select('*, types_ateliers(*)').eq('id', id).single()
    setAtelier(a)

    const { data: types } = await supabase.from('types_ateliers').select('*').order('nom')
    setTypesAteliers(types ?? [])

    const { data: insc } = await supabase
      .from('inscriptions')
      .select('*, participantes(*)')
      .eq('atelier_id', id)
      .order('created_at')
    setInscriptions(insc ?? [])

    if (a?.type_atelier_id) {
      const { data: pack } = await supabase
        .from('packs_ateliers')
        .select('quantite, produits(nom)')
        .eq('type_atelier_id', a.type_atelier_id)
      const actives = (insc ?? []).filter((i) => i.statut !== 'Annulée').length
      setMateriel((pack ?? []).map((p: any) => ({ nom: p.produits.nom, quantite: p.quantite * actives })))
    } else {
      setMateriel([])
    }
  }

  async function changerStatut(inscriptionId: string, nouveauStatut: string) {
    await supabase.from('inscriptions').update({ statut: nouveauStatut }).eq('id', inscriptionId)
    if (nouveauStatut === 'Présente') await confirmerDistribution(inscriptionId)
    if (nouveauStatut === 'Absente') await annulerReservationSansDistribution(inscriptionId)
    if (nouveauStatut === 'Annulée') await libererReservation(inscriptionId)
    charger()
  }

  async function changerTypeAtelier(typeAtelierId: string) {
    await supabase.from('ateliers').update({ type_atelier_id: typeAtelierId || null }).eq('id', id)
    charger()
  }

  if (!atelier) return <div className="p-6">Chargement...</div>

  const actives = inscriptions.filter((i) => i.statut !== 'Annulée')

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <Link to="/ateliers" className="text-rose text-sm">← Tous les ateliers</Link>
      <h1 className="page-title mt-2">{atelier.types_ateliers?.nom || 'Atelier (type non defini)'}</h1>
      <p className="text-plum/60 mb-4">
        {new Date(atelier.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        {atelier.heure_debut ? ` · ${atelier.heure_debut.slice(0, 5)} - ${atelier.heure_fin?.slice(0, 5) ?? ''}` : ''}
      </p>

      <div className="card mb-4">
        <p className="font-semibold text-plum mb-2 text-sm">Type d'atelier</p>
        <select
          className="input"
          value={atelier.type_atelier_id ?? ''}
          onChange={(e) => changerTypeAtelier(e.target.value)}
        >
          <option value="">Choisir un type d'atelier...</option>
          {typesAteliers.map((t) => (
            <option key={t.id} value={t.id}>{t.nom}</option>
          ))}
        </select>
        {!atelier.type_atelier_id && (
          <p className="text-xs text-clay mt-2">
            Tant qu'aucun type n'est choisi, le materiel a preparer ne peut pas etre calcule automatiquement.
          </p>
        )}
        {typesAteliers.length === 0 && (
          <p className="text-xs text-plum/50 mt-2">
            Aucun type d'atelier n'existe encore. Cree-en un dans Parametres, puis reviens ici pour l'affecter.
          </p>
        )}
      </div>

      <div className="card mb-4">
        <p className="font-semibold text-plum mb-2">{actives.length} / {atelier.capacite_max} participantes</p>
        <div className="space-y-3">
          {inscriptions.map((i) => (
            <div key={i.id} className="border-t border-rose-light pt-3 first:border-0 first:pt-0">
              <div className="flex justify-between items-center">
                <Link to={`/participantes/${i.participante_id}`} className="font-semibold text-plum">
                  {i.participantes?.prenom} {i.participantes?.nom}
                </Link>
                <select
                  value={i.statut}
                  onChange={(e) => changerStatut(i.id, e.target.value)}
                  className="text-xs border border-rose-light rounded-full px-2 py-1 bg-white"
                >
                  {['Inscrite', 'Confirmée', 'Annulée', 'Présente', 'Absente'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 flex-wrap mt-1 text-xs">
                {i.couleur_choisie && <Badge>{i.couleur_choisie}</Badge>}
                {i.cookie_choisi && <Badge>{i.cookie_choisi}</Badge>}
                <Badge tone={i.photo_autorisee ? 'ok' : 'critique'}>{i.photo_autorisee ? 'Photo autorisee' : 'Photo interdite'}</Badge>
                <Badge tone={i.pelote_achetee ? 'ok' : 'bas'}>{i.pelote_achetee ? 'Pelote achetee' : 'Pelote a acheter'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="font-semibold text-plum mb-2">Materiel a preparer</p>
        {materiel.map((m) => (
          <p key={m.nom} className="text-sm text-plum/80">- {m.quantite} x {m.nom}</p>
        ))}
        {materiel.length === 0 && <p className="text-sm text-plum/50">Choisis d'abord un type d'atelier ci-dessus, ou definis son contenu dans Parametres.</p>}
      </div>
    </div>
  )
}
