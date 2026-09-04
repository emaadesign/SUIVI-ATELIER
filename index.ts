// Fonction Supabase Edge — synchronise les inscriptions depuis l'API Billetweb.
// Se déclenche : (1) manuellement depuis le bouton "Actualiser" de l'app,
// (2) automatiquement via un Cron Supabase toutes les 20 minutes (voir README).
//
// IMPORTANT SÉCURITÉ : la clé Billetweb n'est JAMAIS envoyée au téléphone.
// Elle vit uniquement ici, comme "secret" de la fonction (BILLETWEB_USER / BILLETWEB_KEY).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const BILLETWEB_USER = Deno.env.get('BILLETWEB_USER')!
const BILLETWEB_KEY = Deno.env.get('BILLETWEB_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Liste des événements Billetweb (= tes ateliers côté billetterie)
  const eventsUrl = `https://www.billetweb.fr/api/events?user=${BILLETWEB_USER}&key=${BILLETWEB_KEY}&version=1`
  const eventsRes = await fetch(eventsUrl)
  if (!eventsRes.ok) {
    return new Response(JSON.stringify({ error: 'Impossible de contacter Billetweb' }), { status: 502 })
  }
  const events = await eventsRes.json()

  let nouvellesInscriptions = 0
  let doublonsIgnores = 0

  for (const event of events) {
    // 2. Rattache/complète l'atelier correspondant côté base (par billetweb_event_id)
    const { data: atelierExistant } = await supabase
      .from('ateliers')
      .select('id')
      .eq('billetweb_event_id', String(event.id))
      .maybeSingle()

    let atelierId = atelierExistant?.id
    if (!atelierId) {
      // Un atelier détecté pour la première fois : à faire correspondre manuellement
      // à un type d'atelier depuis l'app (page "Import Billetweb").
      const { data: nouvelAtelier } = await supabase
        .from('ateliers')
        .insert({
          billetweb_event_id: String(event.id),
          date: event.start_date?.split(' ')[0] ?? event.start_date,
          heure_debut: event.start_date?.split(' ')[1] ?? null,
          lieu: event.address ?? '',
          capacite_max: event.max_attendees ?? 6
        })
        .select('id')
        .single()
      atelierId = nouvelAtelier?.id
    }

    // 3. Récupère les inscrits ("attendees") de cet événement
    const attendeesUrl = `https://www.billetweb.fr/api/event/${event.id}/attendees?user=${BILLETWEB_USER}&key=${BILLETWEB_KEY}&version=1`
    const attendeesRes = await fetch(attendeesUrl)
    if (!attendeesRes.ok) continue
    const attendees = await attendeesRes.json()

    for (const a of attendees) {
      const sourceId = String(a.id) // identifiant unique Billetweb -> anti-doublon

      const { data: dejaImporte } = await supabase
        .from('inscriptions')
        .select('id')
        .eq('source_billetweb_id', sourceId)
        .maybeSingle()

      if (dejaImporte) {
        doublonsIgnores++
        continue
      }

      // Trouve ou crée la participante (rapprochement par email)
      let participanteId: string | undefined
      const { data: participanteExistante } = await supabase
        .from('participantes')
        .select('id')
        .eq('email', a.email)
        .maybeSingle()

      if (participanteExistante) {
        participanteId = participanteExistante.id
      } else {
        const { data: nouvelleParticipante } = await supabase
          .from('participantes')
          .insert({ nom: a.last_name, prenom: a.first_name, email: a.email, telephone: a.phone ?? null })
          .select('id')
          .single()
        participanteId = nouvelleParticipante?.id
      }

      // Champs de formulaire "connus" à extraire s'ils existent, le reste va dans reponses_formulaire
      const champsConnus = ['couleur', 'couleur souhaitée', 'cookie', 'parfum du cookie', 'photo', 'autorisation photo']
      let couleur: string | null = null
      let cookie: string | null = null
      let photoAutorisee: boolean | null = null
      const autresReponses: { question: string; reponse: string }[] = []

      for (const champ of a.form_fields ?? []) {
        const label = (champ.name ?? '').toLowerCase()
        if (label.includes('couleur')) couleur = champ.value
        else if (label.includes('cookie') || label.includes('parfum')) cookie = champ.value
        else if (label.includes('photo')) {
          photoAutorisee = /oui|yes|autoris/i.test(champ.value)
        } else {
          autresReponses.push({ question: champ.name, reponse: champ.value })
        }
      }

      const { data: inscription } = await supabase
        .from('inscriptions')
        .insert({
          participante_id: participanteId,
          atelier_id: atelierId,
          statut: a.canceled ? 'Annulée' : 'Confirmée',
          couleur_choisie: couleur,
          cookie_choisi: cookie,
          photo_autorisee: photoAutorisee,
          source_billetweb_id: sourceId
        })
        .select('id')
        .single()

      if (autresReponses.length && inscription) {
        await supabase.from('reponses_formulaire').insert(
          autresReponses.map((r) => ({ inscription_id: inscription.id, question: r.question, reponse: r.reponse }))
        )
      }

      // Réserve automatiquement les goodies/livrets du pack de l'atelier (voir lib/stock.ts pour la logique miroir côté frontend)
      if (inscription && atelierId) {
        const { data: atelier } = await supabase.from('ateliers').select('type_atelier_id').eq('id', atelierId).single()
        if (atelier?.type_atelier_id) {
          const { data: pack } = await supabase
            .from('packs_ateliers')
            .select('produit_id, quantite')
            .eq('type_atelier_id', atelier.type_atelier_id)
          for (const ligne of pack ?? []) {
            await supabase.from('mouvements_stock').insert({
              produit_id: ligne.produit_id,
              type: 'reservation',
              quantite: ligne.quantite,
              inscription_id: inscription.id,
              commentaire: 'Réservation automatique à l\'inscription'
            })
          }
        }
      }

      nouvellesInscriptions++
    }
  }

  return new Response(
    JSON.stringify({ nouvellesInscriptions, doublonsIgnores }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
