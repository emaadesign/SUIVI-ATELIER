export type StatutInscription = 'Inscrite' | 'Confirmée' | 'Annulée' | 'Présente' | 'Absente'

export interface TypeAtelier {
  id: string
  nom: string
  description?: string
}

export interface Atelier {
  id: string
  type_atelier_id: string
  billetweb_event_id?: string
  date: string
  heure_debut?: string
  heure_fin?: string
  lieu?: string
  capacite_max: number
  types_ateliers?: TypeAtelier
}

export interface Participante {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  supprimee?: boolean
}

export interface Inscription {
  id: string
  participante_id: string
  atelier_id: string
  statut: StatutInscription
  couleur_choisie?: string
  cookie_choisi?: string
  photo_autorisee?: boolean
  pelote_achetee?: boolean
  rappel_envoye?: boolean
  message_post_atelier_envoye?: boolean
  whatsapp_envoye?: boolean
  source_billetweb_id?: string
  participantes?: Participante
  ateliers?: Atelier
}

export interface ReponseFormulaire {
  id: string
  inscription_id: string
  question: string
  reponse: string
}

export interface Produit {
  id: string
  nom: string
  unite: string
  seuil_alerte: number
  seuil_alerte_critique: number
}

export interface StockVue extends Produit {
  stock_physique_net: number
  reserve: number
  distribue: number
}

export interface MouvementStock {
  id: string
  produit_id: string
  type: 'achat' | 'ajustement' | 'reservation' | 'liberation' | 'distribution'
  quantite: number
  inscription_id?: string
  commentaire?: string
  created_at: string
}

export interface PackAtelier {
  id: string
  type_atelier_id: string
  produit_id: string
  quantite: number
  produits?: Produit
}

export interface MessageType {
  id: string
  type: 'rappel' | 'post_atelier' | 'whatsapp'
  sujet?: string
  contenu: string
}

export interface EnvoiMessage {
  id: string
  inscription_id: string
  type_message: 'rappel' | 'post_atelier' | 'whatsapp'
  statut: 'envoyé' | 'non_envoyé'
  date_envoi?: string
}
