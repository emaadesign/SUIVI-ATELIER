import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { montantAnimatrice, resultatAtelier, formatEuros } from '../lib/finance'
import Badge from '../components/Badge'

export default function Budget() {
  const [searchParams] = useSearchParams()
  const [ateliers, setAteliers] = useState<any[]>([])
  const [atelierId, setAtelierId] = useState(searchParams.get('atelier') ?? '')
  const [budget, setBudget] = useState<any>(null)
  const [atelierInfo, setAtelierInfo] = useState<any>(null)
  const [depenses, setDepenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  const [encaissementManuel, setEncaissementManuel] = useState('')
  const [prixPlace, setPrixPlace] = useState('')

  const [nouvelleDepense, setNouvelleDepense] = useState({ categorie_id: '', libelle: '', montant: '', date_paiement: '', statut: 'paye' })

  const [animatriceMode, setAnimatriceMode] = useState<'fixe' | 'pourcentage' | ''>('')
  const [animatriceMontantFixe, setAnimatriceMontantFixe] = useState('')
  const [animatricePourcentage, setAnimatricePourcentage] = useState('')
  const [animatriceBase, setAnimatriceBase] = useState<'encaissements' | 'resultat_apres_depenses'>('encaissements')

  useEffect(() => {
    supabase.from('ateliers').select('id, date, types_ateliers(nom)').order('date', { ascending: false })
      .then(({ data }) => setAteliers(data ?? []))
    supabase.from('categories_depenses').select('*').order('nom').then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    if (atelierId) charger()
  }, [atelierId])

  async function charger() {
    const { data: b } = await supabase.from('v_budget_ateliers').select('*').eq('atelier_id', atelierId).single()
    setBudget(b)
    setEncaissementManuel(b?.encaissement_reel != null ? String(b.encaissement_reel) : '')
    setPrixPlace(b?.prix_place != null ? String(b.prix_place) : '')
    setAnimatriceMode(b?.animatrice_mode ?? '')
    setAnimatriceMontantFixe(b?.animatrice_montant_fixe != null ? String(b.animatrice_montant_fixe) : '')
    setAnimatricePourcentage(b?.animatrice_pourcentage != null ? String(b.animatrice_pourcentage) : '')
    setAnimatriceBase(b?.animatrice_base ?? 'encaissements')

    const { data: a } = await supabase.from('ateliers').select('*, types_ateliers(nom)').eq('id', atelierId).single()
    setAtelierInfo(a)

    const { data: d } = await supabase.from('depenses').select('*, categories_depenses(nom, icone)').eq('atelier_id', atelierId).order('date_paiement', { ascending: false })
    setDepenses(d ?? [])
  }

  async function sauvegarderEncaissement() {
    await supabase.from('ateliers').update({
      encaissement_reel: encaissementManuel ? parseFloat(encaissementManuel) : null,
      prix_place: prixPlace ? parseFloat(prixPlace) : null
    }).eq('id', atelierId)
    charger()
  }

  async function sauvegarderAnimatrice() {
    await supabase.from('ateliers').update({
      animatrice_mode: animatriceMode || null,
      animatrice_montant_fixe: animatriceMontantFixe ? parseFloat(animatriceMontantFixe) : null,
      animatrice_pourcentage: animatricePourcentage ? parseFloat(animatricePourcentage) : null,
      animatrice_base: animatriceBase
    }).eq('id', atelierId)
    charger()
  }

  async function changerStatutPaiementAnimatrice(statut: string) {
    await supabase.from('ateliers').update({
      animatrice_statut_paiement: statut,
      animatrice_date_paiement: statut === 'paye' ? new Date().toISOString().split('T')[0] : null
    }).eq('id', atelierId)
    charger()
  }

  async function ajouterDepense() {
    if (!nouvelleDepense.libelle || !nouvelleDepense.montant) return
    await supabase.from('depenses').insert({
      atelier_id: atelierId,
      categorie_id: nouvelleDepense.categorie_id || null,
      libelle: nouvelleDepense.libelle,
      montant: parseFloat(nouvelleDepense.montant),
      date_paiement: nouvelleDepense.date_paiement || null,
      statut: nouvelleDepense.statut
    })
    setNouvelleDepense({ categorie_id: '', libelle: '', montant: '', date_paiement: '', statut: 'paye' })
    charger()
  }

  async function supprimerDepense(id: string) {
    await supabase.from('depenses').delete().eq('id', id)
    charger()
  }

  const depensesPayees = depenses.filter((d) => d.statut === 'paye')
  const depensesPrevues = depenses.filter((d) => d.statut === 'prevu')
  const totalPaye = depensesPayees.reduce((s, d) => s + Number(d.montant), 0)

  const resultat = budget ? resultatAtelier(budget) : 0
  const montantAnim = budget ? montantAnimatrice(budget) : 0

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Budget</h1>
      <p className="text-plum/60 mb-4">Suivi financier par atelier</p>

      <select className="input mb-4" value={atelierId} onChange={(e) => setAtelierId(e.target.value)}>
        <option value="">Choisir un atelier</option>
        {ateliers.map((a) => (
          <option key={a.id} value={a.id}>{a.types_ateliers?.nom} - {new Date(a.date).toLocaleDateString('fr-FR')}</option>
        ))}
      </select>

      {atelierId && budget && (
        <>
          <div className="card mb-4">
            <p className="font-semibold text-plum mb-3">{atelierInfo?.types_ateliers?.nom} - {new Date(atelierInfo?.date).toLocaleDateString('fr-FR')}</p>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-sage-light rounded-soft p-2">
                <p className="text-xs text-plum/60">Encaissements</p>
                <p className="font-semibold text-plum">{formatEuros(budget.encaissements)}</p>
              </div>
              <div className="bg-rose-light rounded-soft p-2">
                <p className="text-xs text-plum/60">Depenses</p>
                <p className="font-semibold text-plum">{formatEuros(budget.depenses_reelles)}</p>
              </div>
              <div className="bg-mustard-light rounded-soft p-2">
                <p className="text-xs text-plum/60">Animatrice</p>
                <p className="font-semibold text-plum">{formatEuros(montantAnim)}</p>
              </div>
              <div className={`rounded-soft p-2 ${resultat >= 0 ? 'bg-sage-light' : 'bg-clay/15'}`}>
                <p className="text-xs text-plum/60">Resultat</p>
                <p className="font-semibold text-plum">{resultat >= 0 ? '🟢' : '🔴'} {formatEuros(resultat)}</p>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <p className="font-semibold text-plum mb-2 text-sm">Encaissements</p>
            <label className="text-xs text-plum/60">Prix d'une place (EUR)</label>
            <input className="input mb-2" type="number" step="0.01" value={prixPlace} onChange={(e) => setPrixPlace(e.target.value)} placeholder="ex: 60" />
            <label className="text-xs text-plum/60">Forcer un montant encaisse (EUR) - optionnel</label>
            <input className="input mb-2" type="number" step="0.01" value={encaissementManuel} onChange={(e) => setEncaissementManuel(e.target.value)} placeholder="Laisse vide pour calcul automatique" />
            <button className="btn-secondary w-full text-sm" onClick={sauvegarderEncaissement}>Enregistrer</button>
            <p className="text-xs text-plum/40 mt-2">
              Sans montant force, le calcul se base sur les montants payes recuperes de Billetweb, sinon sur le nombre de participantes actives x prix de la place.
            </p>
          </div>

          <div className="card mb-4">
            <p className="font-semibold text-plum mb-2 text-sm">Depenses</p>
            {depensesPayees.map((d) => (
              <div key={d.id} className="flex justify-between items-center py-1 border-b border-rose-light last:border-0 text-sm">
                <span>{d.categories_depenses?.icone} {d.libelle}</span>
                <div className="flex items-center gap-2">
                  <span>{formatEuros(Number(d.montant))}</span>
                  <button onClick={() => supprimerDepense(d.id)} className="text-clay text-xs">supprimer</button>
                </div>
              </div>
            ))}
            <p className="text-sm font-semibold text-plum mt-2">Total paye : {formatEuros(totalPaye)}</p>

            {depensesPrevues.length > 0 && (
              <div className="mt-3 border-t border-rose-light pt-2">
                <p className="text-xs text-plum/50 mb-1">Prevues (non comptees dans le resultat) :</p>
                {depensesPrevues.map((d) => (
                  <div key={d.id} className="flex justify-between items-center py-1 text-sm text-plum/60">
                    <span>{d.libelle}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatEuros(Number(d.montant))}</span>
                      <button onClick={() => supprimerDepense(d.id)} className="text-clay text-xs">supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 border-t border-rose-light pt-3 space-y-2">
              <select className="input" value={nouvelleDepense.categorie_id} onChange={(e) => setNouvelleDepense({ ...nouvelleDepense, categorie_id: e.target.value })}>
                <option value="">Categorie</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
              </select>
              <input className="input" placeholder="Libelle (ex: Laine)" value={nouvelleDepense.libelle} onChange={(e) => setNouvelleDepense({ ...nouvelleDepense, libelle: e.target.value })} />
              <input className="input" type="number" step="0.01" placeholder="Montant (EUR)" value={nouvelleDepense.montant} onChange={(e) => setNouvelleDepense({ ...nouvelleDepense, montant: e.target.value })} />
              <input className="input" type="date" value={nouvelleDepense.date_paiement} onChange={(e) => setNouvelleDepense({ ...nouvelleDepense, date_paiement: e.target.value })} />
              <select className="input" value={nouvelleDepense.statut} onChange={(e) => setNouvelleDepense({ ...nouvelleDepense, statut: e.target.value })}>
                <option value="paye">Deja payee (compte dans le resultat)</option>
                <option value="prevu">Prevue seulement</option>
              </select>
              <button className="btn-primary w-full text-sm" onClick={ajouterDepense}>Ajouter la depense</button>
            </div>
          </div>

          <div className="card">
            <p className="font-semibold text-plum mb-2 text-sm">Animatrice</p>
            <select className="input mb-2" value={animatriceMode} onChange={(e) => setAnimatriceMode(e.target.value as any)}>
              <option value="">Pas de remuneration animatrice</option>
              <option value="fixe">Montant fixe</option>
              <option value="pourcentage">Pourcentage</option>
            </select>

            {animatriceMode === 'fixe' && (
              <input className="input mb-2" type="number" step="0.01" placeholder="Montant fixe (EUR)" value={animatriceMontantFixe} onChange={(e) => setAnimatriceMontantFixe(e.target.value)} />
            )}
            {animatriceMode === 'pourcentage' && (
              <>
                <input className="input mb-2" type="number" step="0.1" placeholder="Pourcentage (ex: 30)" value={animatricePourcentage} onChange={(e) => setAnimatricePourcentage(e.target.value)} />
                <select className="input mb-2" value={animatriceBase} onChange={(e) => setAnimatriceBase(e.target.value as any)}>
                  <option value="encaissements">Sur les encaissements</option>
                  <option value="resultat_apres_depenses">Sur le resultat apres depenses</option>
                </select>
              </>
            )}
            <button className="btn-secondary w-full text-sm" onClick={sauvegarderAnimatrice}>Enregistrer</button>

            <div className="mt-3 border-t border-rose-light pt-3 flex justify-between items-center">
              <div>
                <p className="text-sm">Montant du : <span className="font-semibold">{formatEuros(montantAnim)}</span></p>
                <Badge tone={budget.animatrice_statut_paiement === 'paye' ? 'ok' : 'bas'}>
                  {budget.animatrice_statut_paiement === 'paye' ? 'Paye' : 'A reverser'}
                </Badge>
              </div>
              <button
                className="btn-secondary text-sm"
                onClick={() => changerStatutPaiementAnimatrice(budget.animatrice_statut_paiement === 'paye' ? 'a_reverser' : 'paye')}
              >
                {budget.animatrice_statut_paiement === 'paye' ? 'Marquer a reverser' : 'Marquer paye'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
