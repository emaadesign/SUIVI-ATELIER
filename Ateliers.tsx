import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Badge from '../components/Badge'

export default function Ateliers() {
  const [ateliers, setAteliers] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('ateliers')
      .select('*, types_ateliers(nom), inscriptions(id, statut)')
      .order('date', { ascending: true })
      .then(({ data }) => setAteliers(data ?? []))
  }, [])

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Ateliers</h1>
      <p className="text-plum/60 mb-4">Tous tes ateliers, passés et à venir</p>
      <div className="space-y-3">
        {ateliers.map((a) => {
          const nb = a.inscriptions.filter((i: any) => i.statut !== 'Annulée').length
          return (
            <Link to={`/ateliers/${a.id}`} key={a.id} className="card block">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-plum">{a.types_ateliers?.nom}</p>
                  <p className="text-plum/60 text-sm">
                    {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {a.heure_debut ? ` · ${a.heure_debut.slice(0, 5)}` : ''}
                  </p>
                </div>
                <Badge tone={nb >= a.capacite_max ? 'critique' : 'neutre'}>{nb} / {a.capacite_max}</Badge>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
