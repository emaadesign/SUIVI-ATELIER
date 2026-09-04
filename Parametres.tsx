import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Parametres() {
  const [types, setTypes] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [packs, setPacks] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [params, setParams] = useState<Record<string, string>>({})

  const [nouveauType, setNouveauType] = useState('')
  const [nouveauProduit, setNouveauProduit] = useState('')
  const [nouveauPack, setNouveauPack] = useState({ type_atelier_id: '', produit_id: '', quantite: 1 })

  useEffect(() => { charger() }, [])

  async function charger() {
    const [t, p, pk, m, par] = await Promise.all([
      supabase.from('types_ateliers').select('*'),
      supabase.from('produits').select('*'),
      supabase.from('packs_ateliers').select('*, produits(nom), types_ateliers(nom)'),
      supabase.from('messages_types').select('*'),
      supabase.from('parametres').select('*')
    ])
    setTypes(t.data ?? [])
    setProduits(p.data ?? [])
    setPacks(pk.data ?? [])
    setMessages(m.data ?? [])
    setParams(Object.fromEntries((par.data ?? []).map((x: any) => [x.cle, x.valeur])))
  }

  async function ajouterType() {
    if (!nouveauType) return
    await supabase.from('types_ateliers').insert({ nom: nouveauType })
    setNouveauType('')
    charger()
  }

  async function ajouterProduit() {
    if (!nouveauProduit) return
    await supabase.from('produits').insert({ nom: nouveauProduit, seuil_alerte: 10, seuil_alerte_critique: 5 })
    setNouveauProduit('')
    charger()
  }

  async function ajouterPack() {
    if (!nouveauPack.type_atelier_id || !nouveauPack.produit_id) return
    await supabase.from('packs_ateliers').insert(nouveauPack)
    setNouveauPack({ type_atelier_id: '', produit_id: '', quantite: 1 })
    charger()
  }

  async function sauvegarderMessage(id: string, contenu: string, sujet: string) {
    await supabase.from('messages_types').update({ contenu, sujet }).eq('id', id)
  }

  async function sauvegarderParametre(cle: string, valeur: string) {
    await supabase.from('parametres').upsert({ cle, valeur })
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto space-y-6">
      <h1 className="page-title">Paramètres</h1>

      <section className="card">
        <p className="font-semibold text-plum mb-2">Informations générales</p>
        {[
          { cle: 'nom_activite', label: "Nom de l'activité" },
          { cle: 'adresse_ateliers', label: 'Adresse des ateliers' },
          { cle: 'lien_whatsapp', label: 'Lien du groupe WhatsApp' }
        ].map((champ) => (
          <input
            key={champ.cle}
            className="input mb-2"
            placeholder={champ.label}
            defaultValue={params[champ.cle] ?? ''}
            onBlur={(e) => sauvegarderParametre(champ.cle, e.target.value)}
          />
        ))}
      </section>

      <section className="card">
        <p className="font-semibold text-plum mb-2">Types d'ateliers</p>
        {types.map((t) => <p key={t.id} className="text-sm py-1">• {t.nom}</p>)}
        <div className="flex gap-2 mt-2">
          <input className="input" placeholder="Nouveau type (ex: Atelier fun)" value={nouveauType} onChange={(e) => setNouveauType(e.target.value)} />
          <button className="btn-secondary" onClick={ajouterType}>+</button>
        </div>
      </section>

      <section className="card">
        <p className="font-semibold text-plum mb-2">Produits / goodies</p>
        {produits.map((p) => <p key={p.id} className="text-sm py-1">• {p.nom}</p>)}
        <div className="flex gap-2 mt-2">
          <input className="input" placeholder="Nouveau produit (ex: Pince)" value={nouveauProduit} onChange={(e) => setNouveauProduit(e.target.value)} />
          <button className="btn-secondary" onClick={ajouterProduit}>+</button>
        </div>
      </section>

      <section className="card">
        <p className="font-semibold text-plum mb-2">Contenu des ateliers (packs)</p>
        {types.map((t) => (
          <div key={t.id} className="mb-3">
            <p className="text-sm font-semibold text-plum/80">{t.nom}</p>
            {packs.filter((pk) => pk.type_atelier_id === t.id).map((pk) => (
              <p key={pk.id} className="text-sm text-plum/70">— {pk.quantite} × {pk.produits?.nom}</p>
            ))}
          </div>
        ))}
        <div className="flex gap-2 flex-wrap mt-2">
          <select className="input" value={nouveauPack.type_atelier_id} onChange={(e) => setNouveauPack({ ...nouveauPack, type_atelier_id: e.target.value })}>
            <option value="">Type d'atelier</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
          <select className="input" value={nouveauPack.produit_id} onChange={(e) => setNouveauPack({ ...nouveauPack, produit_id: e.target.value })}>
            <option value="">Produit</option>
            {produits.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <input className="input w-20" type="number" min={1} value={nouveauPack.quantite} onChange={(e) => setNouveauPack({ ...nouveauPack, quantite: parseInt(e.target.value, 10) })} />
          <button className="btn-secondary" onClick={ajouterPack}>Ajouter au pack</button>
        </div>
      </section>

      <section className="card">
        <p className="font-semibold text-plum mb-2">Messages</p>
        {messages.map((m) => (
          <div key={m.id} className="mb-3">
            <p className="text-sm font-semibold text-plum/80 capitalize">{m.type.replace('_', ' ')}</p>
            <input className="input mb-1" defaultValue={m.sujet ?? ''} placeholder="Sujet" onBlur={(e) => sauvegarderMessage(m.id, m.contenu, e.target.value)} />
            <textarea className="input" rows={4} defaultValue={m.contenu} onBlur={(e) => sauvegarderMessage(m.id, e.target.value, m.sujet)} />
            <p className="text-xs text-plum/40 mt-1">Variables : {'{prenom} {date} {heure} {lieu} {type_atelier} {lien_whatsapp}'}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
