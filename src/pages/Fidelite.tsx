import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatEuros } from '../lib/finance'

export default function Fidelite() {
  const [participantes, setParticipantes] = useState<any[]>([])

  useEffect(() => {
    supabase.from('v_fidelite_participantes').select('*').order('ateliers_realises', { ascending: false })
      .then(({ data }) => setParticipantes(data ?? []))
  }, [])

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Fidelite</h1>
      <p className="text-plum/60 mb-4">Tes participantes les plus fideles</p>

      <div className="space-y-2">
        {participantes.map((p, index) => (
          <Link to={`/participantes/${p.participante_id}`} key={p.participante_id} className="card flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-plum/40 font-display text-lg w-6">{index + 1}</span>
              <div>
                <p className="font-semibold text-plum">{p.prenom} {p.nom}</p>
                <p className="text-plum/50 text-xs">
                  {p.derniere_participation ? `Dernier atelier : ${new Date(p.derniere_participation).toLocaleDateString('fr-FR')}` : 'Aucune participation enregistree'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-plum">{p.ateliers_realises}</p>
              <p className="text-plum/40 text-xs">atelier(s)</p>
            </div>
          </Link>
        ))}
        {participantes.length === 0 && <p className="text-plum/50 text-sm">Aucune participante pour le moment.</p>}
      </div>
    </div>
  )
}
