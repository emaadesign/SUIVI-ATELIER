import { supabase } from './supabase'
import type { StockVue } from '../types'

/** Stock disponible = (physique - distribué) - réservé */
export function stockDisponible(s: StockVue) {
  return s.stock_physique_net - s.distribue - s.reserve
}

export function niveauAlerte(s: StockVue): 'ok' | 'bas' | 'critique' {
  const dispo = stockDisponible(s)
  if (dispo <= s.seuil_alerte_critique) return 'critique'
  if (dispo <= s.seuil_alerte) return 'bas'
  return 'ok'
}

/** Réserve automatiquement le pack d'un type d'atelier pour une inscription donnée. */
export async function reserverPack(typeAtelierId: string, inscriptionId: string) {
  const { data: pack } = await supabase
    .from('packs_ateliers')
    .select('produit_id, quantite')
    .eq('type_atelier_id', typeAtelierId)
  if (!pack) return
  const mouvements = pack.map((l) => ({
    produit_id: l.produit_id,
    type: 'reservation' as const,
    quantite: l.quantite,
    inscription_id: inscriptionId,
    commentaire: 'Réservation automatique à l\'inscription'
  }))
  if (mouvements.length) await supabase.from('mouvements_stock').insert(mouvements)
}

/** Annulation : libère tout ce qui était réservé pour cette inscription. */
export async function libererReservation(inscriptionId: string) {
  const { data: reservations } = await supabase
    .from('mouvements_stock')
    .select('produit_id, quantite')
    .eq('inscription_id', inscriptionId)
    .eq('type', 'reservation')
  if (!reservations) return
  const liberations = reservations.map((r) => ({
    produit_id: r.produit_id,
    type: 'liberation' as const,
    quantite: r.quantite,
    inscription_id: inscriptionId,
    commentaire: 'Libération suite à annulation'
  }))
  if (liberations.length) await supabase.from('mouvements_stock').insert(liberations)
}

/** Passage "Présente" : la réservation devient une distribution réelle. */
export async function confirmerDistribution(inscriptionId: string) {
  const { data: reservations } = await supabase
    .from('mouvements_stock')
    .select('produit_id, quantite')
    .eq('inscription_id', inscriptionId)
    .eq('type', 'reservation')
  if (!reservations) return
  const distributions = reservations.map((r) => ({
    produit_id: r.produit_id,
    type: 'distribution' as const,
    quantite: r.quantite,
    inscription_id: inscriptionId,
    commentaire: 'Distribué le jour de l\'atelier'
  }))
  const liberations = reservations.map((r) => ({
    produit_id: r.produit_id,
    type: 'liberation' as const,
    quantite: r.quantite,
    inscription_id: inscriptionId,
    commentaire: 'Sortie de la réserve (distribué)'
  }))
  if (distributions.length) {
    await supabase.from('mouvements_stock').insert(distributions)
    await supabase.from('mouvements_stock').insert(liberations)
  }
}

/** Absente : rien n'a été distribué, la réservation est simplement libérée. */
export async function annulerReservationSansDistribution(inscriptionId: string) {
  await libererReservation(inscriptionId)
}

export async function ajusterStockManuel(produitId: string, quantite: number, commentaire: string) {
  await supabase.from('mouvements_stock').insert({
    produit_id: produitId,
    type: 'ajustement',
    quantite,
    commentaire
  })
}
