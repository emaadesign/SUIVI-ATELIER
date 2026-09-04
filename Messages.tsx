import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Messages() {
  const [ateliers, setAteliers] = useState<any[]>([])
  const [envoiEnCours, setEnvoiEnCours] = useState<string | null>(null)
  const [dernierResultat, setDernierResultat] = useState<string | null>(null)

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data } = await supabase
      .from('ateliers')
      .select('*, types_ateliers(nom), inscriptions(id, rappel_envoye, message_post_atelier_envoye, whatsapp_envoye, statut)')
      .order('date', { ascending: true })
    setAteliers(data ?? [])
  }

  async function envoyer(atelierId: string, typeMessage: 'rappel' | 'post_atelier' | 'whatsapp') {
    setEnvoiEnCours(`${atelierId}-${typeMessage}`)
    setDernierResultat(null)
    const { data, error } = await supabase.functions.invoke('send-message', { body: { atelierId, typeMessage } })
    setEnvoiEnCours(null)
    setDernierResultat(error ? "Erreur lors de l'envoi" : `${data.envoyes} message(s) envoyé(s) ✅`)
    charger()
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Messages</h1>
      <p className="text-plum/60 mb-4">Rappels, remerciements et invitation WhatsApp</p>
      {dernierResultat && <div className="card mb-4 text-sm">{dernierResultat}</div>}

      <div className="space-y-4">
        {ateliers.map((a) => {
          const actives = a.inscriptions.filter((i: any) => i.statut !== 'Annulée')
          const rappelsFaits = actives.filter((i: any) => i.rappel_envoye).length
          const postFaits = actives.filter((i: any) => i.message_post_atelier_envoye).length
          const whatsappFaits = actives.filter((i: any) => i.whatsapp_envoye).length
          return (
            <div key={a.id} className="card">
              <p className="font-semibold text-plum">{a.types_ateliers?.nom}</p>
              <p className="text-plum/60 text-sm mb-3">{new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>

              <div className="space-y-2">
                <BoutonEnvoi
                  label={`📩 Envoyer le rappel (${rappelsFaits}/${actives.length})`}
                  chargement={envoiEnCours === `${a.id}-rappel`}
                  onClick={() => envoyer(a.id, 'rappel')}
                />
                <BoutonEnvoi
                  label={`💌 Message post-atelier (${postFaits}/${actives.length})`}
                  chargement={envoiEnCours === `${a.id}-post_atelier`}
                  onClick={() => envoyer(a.id, 'post_atelier')}
                />
                <BoutonEnvoi
                  label={`📱 Inviter au groupe WhatsApp (${whatsappFaits}/${actives.length})`}
                  chargement={envoiEnCours === `${a.id}-whatsapp`}
                  onClick={() => envoyer(a.id, 'whatsapp')}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BoutonEnvoi({ label, chargement, onClick }: { label: string; chargement: boolean; onClick: () => void }) {
  return (
    <button className="btn-secondary w-full text-sm" disabled={chargement} onClick={onClick}>
      {chargement ? 'Envoi en cours…' : label}
    </button>
  )
}
