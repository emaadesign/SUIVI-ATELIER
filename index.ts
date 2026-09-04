// Fonction Supabase Edge — envoie un email (rappel, post-atelier ou invitation WhatsApp)
// via Resend (https://resend.com — gratuit jusqu'à 3000 emails/mois, largement suffisant ici).
//
// Appelée depuis la page "Messages" de l'app avec { atelierId, typeMessage }.
// Secret nécessaire : RESEND_API_KEY (voir README pour la configuration).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EMAIL_EXPEDITEUR = Deno.env.get('EMAIL_EXPEDITEUR') ?? 'ateliers@example.com'

function remplaceVariables(texte: string, vars: Record<string, string>) {
  return texte.replace(/\{(\w+)\}/g, (_, cle) => vars[cle] ?? '')
}

Deno.serve(async (req) => {
  const { atelierId, typeMessage } = await req.json()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: atelier } = await supabase.from('ateliers').select('*, types_ateliers(nom)').eq('id', atelierId).single()
  const { data: parametres } = await supabase.from('parametres').select('*')
  const params = Object.fromEntries((parametres ?? []).map((p: any) => [p.cle, p.valeur]))

  const { data: modele } = await supabase.from('messages_types').select('*').eq('type', typeMessage).single()
  if (!modele) return new Response(JSON.stringify({ error: 'Aucun modèle de message configuré' }), { status: 400 })

  const { data: inscriptions } = await supabase
    .from('inscriptions')
    .select('id, participantes(prenom, email)')
    .eq('atelier_id', atelierId)
    .in('statut', ['Inscrite', 'Confirmée'])

  let envoyes = 0
  for (const i of inscriptions ?? []) {
    const email = (i as any).participantes?.email
    if (!email) continue

    const contenu = remplaceVariables(modele.contenu, {
      prenom: (i as any).participantes?.prenom ?? '',
      date: new Date(atelier.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      heure: atelier.heure_debut?.slice(0, 5) ?? '',
      lieu: atelier.lieu ?? '',
      type_atelier: atelier.types_ateliers?.nom ?? '',
      lien_whatsapp: params.lien_whatsapp ?? '',
      nom_activite: params.nom_activite ?? ''
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_EXPEDITEUR,
        to: email,
        subject: modele.sujet ?? 'Ton atelier crochet',
        text: contenu
      })
    })

    const champStatut =
      typeMessage === 'rappel' ? 'rappel_envoye' : typeMessage === 'post_atelier' ? 'message_post_atelier_envoye' : 'whatsapp_envoye'
    await supabase.from('inscriptions').update({ [champStatut]: true }).eq('id', i.id)
    envoyes++
  }

  return new Response(JSON.stringify({ envoyes }), { headers: { 'Content-Type': 'application/json' } })
})
