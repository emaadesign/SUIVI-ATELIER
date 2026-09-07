import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { montantAnimatrice, resultatAtelier, formatEuros } from '../lib/finance'

export default function HistoriqueDetail() {
  const { id } = useParams()
  const [atelier, setAtelier] = useState<any>(null)
  const [budget, setBudget] = useState<any>(null)
  const [depenses, setDepenses] = useState<any[]>([])
  const [presentes, setPresentes] = useState<any[]>([])

  useEffect(() => {
    supabase.from('ateliers').select('*, types_ateliers(nom)').eq('id', id).single().then(({ data }) => setAtelier(data))
    supabase.from('v_budget_ateliers').select('*').eq('atelier_id', id).single().then(({ data }) => setBudget(data))
    supabase.from('depenses').select('*, categories_depenses(nom, icone)').eq('atelier_id', id).eq('statut', 'paye')
      .then(({ data }) => setDepenses(data ?? []))
    supabase.from('inscriptions').select('*, participantes(nom, prenom)').eq('atelier_id', id).eq('statut', 'Présente')
      .then(({ data }) => setPresentes(data ?? []))
  }, [id])

  if (!atelier || !budget) return <div className="p-6">Chargement...</div>

  const resultat = resultatAtelier(budget)
  const montantAnim = montantAnimatrice(budget)

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <Link to="/historique" className="text-rose text-sm">← Historique</Link>
      <h1 className="page-title mt-2">{atelier.types_ateliers?.nom}</h1>
      <p className="text-plum/60 mb-4">{new Date(atelier.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {atelier.lieu}</p>

      <div className="card mb-4">
        <p className="text-sm">Participantes presentes : <span className="font-semibold">{presentes.length}</span></p>
        <div className="grid grid-cols-2 gap-2 text-center mt-3">
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

      {depenses.length > 0 && (
        <div className="card mb-4">
          <p className="font-semibold text-plum mb-2 text-sm">Detail des depenses</p>
          {depenses.map((d) => (
            <div key={d.id} className="flex justify-between text-sm py-1 border-b border-rose-light last:border-0">
              <span>{d.categories_depenses?.icone} {d.libelle}</span>
              <span>{formatEuros(Number(d.montant))}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <p className="font-semibold text-plum mb-2 text-sm">Participantes presentes</p>
        {presentes.map((p) => (
          <p key={p.id} className="text-sm text-plum/80 py-1">{p.participantes?.prenom} {p.participantes?.nom}</p>
        ))}
        {presentes.length === 0 && <p className="text-sm text-plum/50">Aucune presence enregistree pour cet atelier.</p>}
      </div>
    </div>
  )
}
