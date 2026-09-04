import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { niveauAlerte, stockDisponible, ajusterStockManuel } from '../lib/stock'
import Badge from '../components/Badge'
import type { StockVue } from '../types'

export default function Stocks() {
  const [stocks, setStocks] = useState<StockVue[]>([])
  const [aAcheter, setAAcheter] = useState<any[]>([])
  const [ajout, setAjout] = useState<Record<string, string>>({})

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data } = await supabase.from('v_stocks').select('*')
    setStocks(data ?? [])

    const { data: pelotes } = await supabase
      .from('inscriptions')
      .select('id, couleur_choisie, participantes(nom, prenom), ateliers(date)')
      .eq('pelote_achetee', false)
      .neq('statut', 'Annulée')
    setAAcheter(pelotes ?? [])
  }

  async function ajouterStock(produitId: string) {
    const quantite = parseInt(ajout[produitId] ?? '0', 10)
    if (!quantite) return
    await ajusterStockManuel(produitId, quantite, 'Achat manuel')
    setAjout({ ...ajout, [produitId]: '' })
    charger()
  }

  async function changerSeuil(produitId: string, champ: 'seuil_alerte' | 'seuil_alerte_critique', valeur: number) {
    await supabase.from('produits').update({ [champ]: valeur }).eq('id', produitId)
    charger()
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Stocks</h1>
      <p className="text-plum/60 mb-4">Ce que tu as, ce qui est réservé, ce qui reste</p>

      <section className="mb-6">
        <h2 className="font-display text-lg text-plum mb-2">Achats à prévoir</h2>
        <div className="card">
          {aAcheter.length === 0 && <p className="text-plum/50 text-sm">Toutes les pelotes sont achetées ✨</p>}
          {aAcheter.map((i) => (
            <p key={i.id} className="text-sm py-1 border-b border-rose-light last:border-0">
              {i.participantes?.prenom} {i.participantes?.nom} — {i.couleur_choisie ?? 'couleur non précisée'} ({new Date(i.ateliers?.date).toLocaleDateString('fr-FR')})
            </p>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-plum mb-2">Produits</h2>
        <div className="space-y-3">
          {stocks.map((s) => {
            const dispo = stockDisponible(s)
            const niveau = niveauAlerte(s)
            return (
              <div key={s.id} className="card">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-plum">{s.nom}</p>
                  <Badge tone={niveau === 'ok' ? 'ok' : niveau === 'bas' ? 'bas' : 'critique'}>
                    {dispo} disponible{s.reserve > 0 ? ` · ${s.reserve} réservé` : ''}
                  </Badge>
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    className="input flex-1"
                    type="number"
                    placeholder="+ quantité achetée"
                    value={ajout[s.id] ?? ''}
                    onChange={(e) => setAjout({ ...ajout, [s.id]: e.target.value })}
                  />
                  <button className="btn-secondary" onClick={() => ajouterStock(s.id)}>Ajouter</button>
                </div>
                <div className="flex gap-3 text-xs text-plum/60">
                  <label className="flex items-center gap-1">
                    Seuil bas
                    <input
                      type="number"
                      className="w-14 border border-rose-light rounded px-1"
                      defaultValue={s.seuil_alerte}
                      onBlur={(e) => changerSeuil(s.id, 'seuil_alerte', parseInt(e.target.value, 10))}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Seuil critique
                    <input
                      type="number"
                      className="w-14 border border-rose-light rounded px-1"
                      defaultValue={s.seuil_alerte_critique}
                      onBlur={(e) => changerSeuil(s.id, 'seuil_alerte_critique', parseInt(e.target.value, 10))}
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
