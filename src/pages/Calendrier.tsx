import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Calendrier() {
  const [mois, setMois] = useState(new Date())
  const [ateliers, setAteliers] = useState<any[]>([])

  useEffect(() => {
    const debut = new Date(mois.getFullYear(), mois.getMonth(), 1).toISOString().split('T')[0]
    const fin = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).toISOString().split('T')[0]
    supabase
      .from('ateliers')
      .select('id, date, heure_debut, types_ateliers(nom)')
      .gte('date', debut)
      .lte('date', fin)
      .then(({ data }) => setAteliers(data ?? []))
  }, [mois])

  const premierJour = new Date(mois.getFullYear(), mois.getMonth(), 1)
  const decalage = (premierJour.getDay() + 6) % 7 // lundi = 0
  const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate()
  const cases = [...Array(decalage).fill(null), ...Array(nbJours).keys()].map((j) => (j === null ? null : j + 1))

  function atelierDuJour(jour: number) {
    const dateStr = new Date(mois.getFullYear(), mois.getMonth(), jour).toISOString().split('T')[0]
    return ateliers.find((a) => a.date === dateStr)
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Calendrier</h1>
      <div className="flex items-center justify-between my-4">
        <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} className="text-rose text-xl px-2">‹</button>
        <p className="font-display text-lg capitalize">{mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} className="text-rose text-xl px-2">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-plum/50 mb-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, idx) => <div key={idx}>{j}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cases.map((jour, idx) => {
          const atelier = jour ? atelierDuJour(jour) : null
          return (
            <div key={idx} className={`aspect-square rounded-soft flex flex-col items-center justify-center text-sm ${atelier ? 'bg-rose text-white font-semibold' : 'text-plum/70'}`}>
              {jour ?? ''}
              {atelier && <span className="text-[9px]">●</span>}
            </div>
          )
        })}
      </div>

      <div className="mt-6 space-y-2">
        {ateliers.map((a) => (
          <Link to={`/ateliers/${a.id}`} key={a.id} className="card flex justify-between items-center">
            <span>{new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
            <span className="text-plum/60 text-sm">{a.types_ateliers?.nom}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
