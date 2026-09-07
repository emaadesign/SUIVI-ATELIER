import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resultatAtelier, formatEuros } from '../lib/finance'

export default function Historique() {
  const [ateliers, setAteliers] = useState<any[]>([])

  useEffect(() => {
    const aujourdHui = new Date().toISOString().split('T')[0]
    supabase
      .from('v_budget_ateliers')
      .select('*, ateliers(id, lieu, types_ateliers(nom), inscriptions(id, statut))')
      .lt('date', aujourdHui)
      .order('date', { ascending: false })
      .then(({ data }) => setAteliers(data ?? []))
  }, [])

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Historique</h1>
      <p className="text-plum/60 mb-4">Tes ateliers termines</p>

      <div className="space-y-3">
        {ateliers.map((a) => {
          const nbPresentes = (a.ateliers?.inscriptions ?? []).filter((i: any) => i.statut === 'Présente').length
          const resultat = resultatAtelier(a)
          return (
            <Link to={`/historique/${a.atelier_id}`} key={a.atelier_id} className="card block">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="font-semibold text-plum">{a.ateliers?.types_ateliers?.nom ?? a.type_atelier_nom}</p>
                  <p className="text-plum/50 text-xs">{new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {a.ateliers?.lieu}</p>
                </div>
                <p className={`font-semibold text-sm ${resultat >= 0 ? 'text-sage' : 'text-clay'}`}>{formatEuros(resultat)}</p>
              </div>
              <p className="text-plum/60 text-xs">{nbPresentes} participante(s) presente(s)</p>
            </Link>
          )
        })}
        {ateliers.length === 0 && <p className="text-plum/50 text-sm">Aucun atelier termine pour le moment.</p>}
      </div>
    </div>
  )
}
