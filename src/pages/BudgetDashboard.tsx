import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { montantAnimatrice, resultatAtelier, formatEuros } from '../lib/finance'

type Periode = 'mois' | 'mois_dernier' | 'trimestre' | 'annee' | 'tout'
type Tri = 'date' | 'resultat_desc' | 'resultat_asc'

export default function BudgetDashboard() {
  const [lignes, setLignes] = useState<any[]>([])
  const [periode, setPeriode] = useState<Periode>('mois')
  const [tri, setTri] = useState<Tri>('date')

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data } = await supabase.from('v_budget_ateliers').select('*, ateliers(types_ateliers(nom))')
    setLignes(
      (data ?? []).map((b: any) => ({
        ...b,
        type_nom: b.ateliers?.types_ateliers?.nom ?? b.type_atelier_nom,
        resultat: resultatAtelier(b),
        montant_animatrice: montantAnimatrice(b)
      }))
    )
  }

  function dansLaPeriode(dateStr: string) {
    const d = new Date(dateStr)
    const maintenant = new Date()
    if (periode === 'tout') return true
    if (periode === 'mois') return d.getFullYear() === maintenant.getFullYear() && d.getMonth() === maintenant.getMonth()
    if (periode === 'mois_dernier') {
      const moisDernier = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1)
      return d.getFullYear() === moisDernier.getFullYear() && d.getMonth() === moisDernier.getMonth()
    }
    if (periode === 'trimestre') {
      const diffMois = (maintenant.getFullYear() - d.getFullYear()) * 12 + (maintenant.getMonth() - d.getMonth())
      return diffMois >= 0 && diffMois < 3
    }
    if (periode === 'annee') return d.getFullYear() === maintenant.getFullYear()
    return true
  }

  const filtrees = lignes.filter((l) => dansLaPeriode(l.date))
  const triees = [...filtrees].sort((a, b) => {
    if (tri === 'resultat_desc') return b.resultat - a.resultat
    if (tri === 'resultat_asc') return a.resultat - b.resultat
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const totalEncaisse = filtrees.reduce((s, l) => s + (l.encaissements ?? 0), 0)
  const totalDepenses = filtrees.reduce((s, l) => s + (l.depenses_reelles ?? 0), 0)
  const totalAnimatrice = filtrees.reduce((s, l) => s + l.montant_animatrice, 0)
  const totalResultat = filtrees.reduce((s, l) => s + l.resultat, 0)

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Dashboard financier</h1>

      <select className="input mb-4" value={periode} onChange={(e) => setPeriode(e.target.value as Periode)}>
        <option value="mois">Ce mois</option>
        <option value="mois_dernier">Mois precedent</option>
        <option value="trimestre">Trimestre</option>
        <option value="annee">Cette annee</option>
        <option value="tout">Tout l'historique</option>
      </select>

      <div className="card mb-4">
        <p className="font-semibold text-plum mb-3">Resume</p>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-sage-light rounded-soft p-2">
            <p className="text-xs text-plum/60">Total encaisse</p>
            <p className="font-semibold text-plum">{formatEuros(totalEncaisse)}</p>
          </div>
          <div className="bg-rose-light rounded-soft p-2">
            <p className="text-xs text-plum/60">Total depenses</p>
            <p className="font-semibold text-plum">{formatEuros(totalDepenses)}</p>
          </div>
          <div className="bg-mustard-light rounded-soft p-2">
            <p className="text-xs text-plum/60">Reverse animatrices</p>
            <p className="font-semibold text-plum">{formatEuros(totalAnimatrice)}</p>
          </div>
          <div className={`rounded-soft p-2 ${totalResultat >= 0 ? 'bg-sage-light' : 'bg-clay/15'}`}>
            <p className="text-xs text-plum/60">Resultat total</p>
            <p className="font-semibold text-plum">{totalResultat >= 0 ? '🟢' : '🔴'} {formatEuros(totalResultat)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <p className="font-display text-lg text-plum">Rentabilite par atelier</p>
        <select className="input w-auto text-xs" value={tri} onChange={(e) => setTri(e.target.value as Tri)}>
          <option value="date">Par date</option>
          <option value="resultat_desc">Plus rentable</option>
          <option value="resultat_asc">Moins rentable</option>
        </select>
      </div>

      <div className="space-y-2">
        {triees.map((l) => (
          <Link to={`/budget?atelier=${l.atelier_id}`} key={l.atelier_id} className="card block">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-plum text-sm">{l.type_nom}</p>
                <p className="text-plum/50 text-xs">{new Date(l.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <p className={`font-semibold ${l.resultat >= 0 ? 'text-sage' : 'text-clay'}`}>{formatEuros(l.resultat)}</p>
            </div>
          </Link>
        ))}
        {triees.length === 0 && <p className="text-plum/50 text-sm">Aucun atelier sur cette periode.</p>}
      </div>
    </div>
  )
}
