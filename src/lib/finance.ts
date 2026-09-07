export interface DonneesBudgetAtelier {
  encaissements: number
  depenses_reelles: number
  animatrice_mode: 'fixe' | 'pourcentage' | null
  animatrice_montant_fixe: number | null
  animatrice_pourcentage: number | null
  animatrice_base: 'encaissements' | 'resultat_apres_depenses' | null
}

export function montantAnimatrice(a: DonneesBudgetAtelier): number {
  if (!a.animatrice_mode) return 0
  if (a.animatrice_mode === 'fixe') return a.animatrice_montant_fixe ?? 0
  const pourcentage = (a.animatrice_pourcentage ?? 0) / 100
  const base = a.animatrice_base === 'resultat_apres_depenses' ? a.encaissements - a.depenses_reelles : a.encaissements
  return Math.max(base, 0) * pourcentage
}

export function resultatAtelier(a: DonneesBudgetAtelier): number {
  return (a.encaissements ?? 0) - (a.depenses_reelles ?? 0) - montantAnimatrice(a)
}

export function formatEuros(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || isNaN(valeur)) return '—'
  return valeur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR'
}
