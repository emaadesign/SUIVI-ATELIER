import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { montantAnimatrice, resultatAtelier } from '../lib/finance'

function telechargerCsv(nomFichier: string, lignes: string[][]) {
  const contenu = lignes.map((l) => l.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}

export default function Export() {
  const [ateliers, setAteliers] = useState<any[]>([])
  const [atelierChoisi, setAtelierChoisi] = useState('')

  useEffect(() => {
    supabase.from('ateliers').select('id, date, types_ateliers(nom)').order('date', { ascending: false })
      .then(({ data }) => setAteliers(data ?? []))
  }, [])

  async function exporterParticipantes() {
    const { data } = await supabase
      .from('inscriptions')
      .select('*, participantes(*), ateliers(date, types_ateliers(nom))')
      .neq('statut', 'Annulée')
    const lignes = [
      ['Prénom', 'Nom', 'Email', 'Téléphone', 'Atelier', 'Date', 'Couleur', 'Cookie', 'Photo autorisée', 'Pelote achetée', 'Statut'],
      ...(data ?? []).map((i: any) => [
        i.participantes?.prenom, i.participantes?.nom, i.participantes?.email, i.participantes?.telephone,
        i.ateliers?.types_ateliers?.nom, i.ateliers?.date, i.couleur_choisie, i.cookie_choisi,
        i.photo_autorisee ? 'Oui' : 'Non', i.pelote_achetee ? 'Oui' : 'Non', i.statut
      ])
    ]
    telechargerCsv('participantes.csv', lignes)
  }

  async function exporterPreparation() {
    if (!atelierChoisi) return
    const { data: atelier } = await supabase.from('ateliers').select('*, types_ateliers(*)').eq('id', atelierChoisi).single()
    const { data: pack } = await supabase.from('packs_ateliers').select('quantite, produits(nom)').eq('type_atelier_id', atelier.type_atelier_id)
    const { count } = await supabase.from('inscriptions').select('id', { count: 'exact', head: true }).eq('atelier_id', atelierChoisi).neq('statut', 'Annulée')

    const lignes = [
      [`Atelier du ${new Date(atelier.date).toLocaleDateString('fr-FR')}`],
      [`${count} participantes`],
      [''],
      ['Matériel', 'Quantité'],
      ...(pack ?? []).map((p: any) => [p.produits.nom, String(p.quantite * (count ?? 0))])
    ]
    telechargerCsv(`preparation-atelier-${atelier.date}.csv`, lignes)
  }

  async function exporterBilanFinancier() {
    const { data } = await supabase.from('v_budget_ateliers').select('*, ateliers(types_ateliers(nom))').order('date', { ascending: false })
    const lignes = [
      ['Date', 'Atelier', 'Encaissements', 'Depenses', 'Animatrice', 'Resultat'],
      ...(data ?? []).map((b: any) => {
        const resultat = resultatAtelier(b)
        const anim = montantAnimatrice(b)
        return [
          new Date(b.date).toLocaleDateString('fr-FR'),
          b.ateliers?.types_ateliers?.nom ?? b.type_atelier_nom ?? '',
          String(b.encaissements ?? 0),
          String(b.depenses_reelles ?? 0),
          String(anim),
          String(resultat)
        ]
      })
    ]
    telechargerCsv('bilan-financier.csv', lignes)
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Export</h1>

      <div className="card mb-4">
        <p className="font-semibold text-plum mb-2">Exporter les participantes</p>
        <p className="text-sm text-plum/60 mb-3">Toutes les participantes actives, au format Excel/CSV.</p>
        <button className="btn-primary w-full" onClick={exporterParticipantes}>Exporter en CSV</button>
      </div>

      <div className="card">
        <p className="font-semibold text-plum mb-2">Liste de préparation d'un atelier</p>
        <select className="input mb-2" value={atelierChoisi} onChange={(e) => setAtelierChoisi(e.target.value)}>
          <option value="">Choisir l'atelier</option>
          {ateliers.map((a) => (
            <option key={a.id} value={a.id}>{a.types_ateliers?.nom} — {new Date(a.date).toLocaleDateString('fr-FR')}</option>
          ))}
        </select>
        <button className="btn-secondary w-full" onClick={exporterPreparation} disabled={!atelierChoisi}>Exporter en CSV</button>
      </div>

      <div className="card mt-4">
        <p className="font-semibold text-plum mb-2">Bilan financier de tous les ateliers</p>
        <p className="text-sm text-plum/60 mb-3">Date, encaissements, depenses, animatrice et resultat pour chaque atelier.</p>
        <button className="btn-primary w-full" onClick={exporterBilanFinancier}>Exporter en CSV</button>
      </div>
    </div>
  )
}
