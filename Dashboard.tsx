import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { niveauAlerte, stockDisponible } from '../lib/stock'
import Badge from '../components/Badge'
import type { Atelier, StockVue } from '../types'

interface AtelierAvecCompte extends Atelier {
  nb_inscrites: number
}

export default function Dashboard() {
  const [ateliers, setAteliers] = useState<AtelierAvecCompte[]>([])
  const [stocks, setStocks] = useState<StockVue[]>([])
  const [pelotesAAcheter, setPelotesAAcheter] = useState(0)
  const [rappelsDemain, setRappelsDemain] = useState(0)

  useEffect(() => { charger() }, [])

  async function charger() {
    const aujourdHui = new Date().toISOString().split('T')[0]

    const { data: ateliersData } = await supabase
      .from('ateliers')
      .select('*, types_ateliers(*), inscriptions(id, statut)')
      .gte('date', aujourdHui)
      .order('date', { ascending: true })
      .limit(5)

    setAteliers(
      (ateliersData ?? []).map((a: any) => ({
        ...a,
        nb_inscrites: a.inscriptions.filter((i: any) => i.statut !== 'Annulée').length
      }))
    )

    const { data: stocksData } = await supabase.from('v_stocks').select('*')
    setStocks(stocksData ?? [])

    const { count: pelotes } = await supabase
      .from('inscriptions')
      .select('id', { count: 'exact', head: true })
      .neq('statut', 'Annulée')
      .eq('pelote_achetee', false)
    setPelotesAAcheter(pelotes ?? 0)

    const demain = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { count: rappels } = await supabase
      .from('ateliers')
      .select('id', { count: 'exact', head: true })
      .eq('date', demain)
    setRappelsDemain(rappels ? rappels : 0)
  }

  const stocksAlerte = stocks.filter((s) => niveauAlerte(s) !== 'ok')

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="font-display text-3xl text-plum">Bonjour 👋</h1>
      <p className="text-plum/60 mb-6">Voici où en sont tes ateliers</p>

      <section className="mb-6">
        <h2 className="font-display text-lg text-plum mb-2">Prochains ateliers</h2>
        <div className="space-y-3">
          {ateliers.length === 0 && <p className="text-plum/50 text-sm">Aucun atelier à venir pour le moment.</p>}
          {ateliers.map((a) => {
            const complet = a.nb_inscrites >= a.capacite_max
            const presque = a.nb_inscrites >= a.capacite_max - 1
            return (
              <Link to={`/ateliers/${a.id}`} key={a.id} className="card block">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-plum">{a.types_ateliers?.nom ?? 'Atelier'}</p>
                    <p className="text-plum/60 text-sm">
                      {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {a.heure_debut ? ` · ${a.heure_debut.slice(0, 5)}` : ''}
                    </p>
                  </div>
                  <Badge tone={complet ? 'critique' : presque ? 'bas' : 'ok'}>
                    {a.nb_inscrites} / {a.capacite_max}
                  </Badge>
                </div>
                {complet && <p className="text-clay text-sm mt-2">🔴 Atelier complet</p>}
                {!complet && presque && <p className="text-mustard text-sm mt-2">🟡 Atelier presque complet</p>}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-display text-lg text-plum mb-2">À faire</h2>
        <div className="card space-y-2 text-sm">
          {pelotesAAcheter > 0 && <p>⚠️ {pelotesAAcheter} pelote{pelotesAAcheter > 1 ? 's' : ''} à acheter</p>}
          {stocksAlerte.map((s) => (
            <p key={s.id}>{niveauAlerte(s) === 'critique' ? '🔴' : '⚠️'} Stock de {s.nom.toLowerCase()} {niveauAlerte(s) === 'critique' ? 'très bas' : 'faible'}</p>
          ))}
          {rappelsDemain > 0 && <p>📩 Rappels à envoyer demain</p>}
          {pelotesAAcheter === 0 && stocksAlerte.length === 0 && rappelsDemain === 0 && (
            <p className="text-plum/50">Tout est sous contrôle ✨</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-plum mb-2">Stocks</h2>
        <div className="card space-y-2">
          {stocks.map((s) => {
            const dispo = stockDisponible(s)
            const niveau = niveauAlerte(s)
            return (
              <div key={s.id} className="flex justify-between items-center text-sm">
                <span>{s.nom}</span>
                <Badge tone={niveau === 'ok' ? 'ok' : niveau === 'bas' ? 'bas' : 'critique'}>
                  {dispo} {niveau === 'ok' ? '🟢' : niveau === 'bas' ? '⚠️' : '🔴'}
                </Badge>
              </div>
            )
          })}
          <Link to="/stocks" className="text-rose text-sm font-semibold block pt-1">Voir tous les stocks →</Link>
        </div>
      </section>
    </div>
  )
}
