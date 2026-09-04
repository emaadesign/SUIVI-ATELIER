import Papa from 'papaparse'
import { supabase } from './supabase'
import { reserverPack } from './stock'

// Colonnes que Billetweb exporte généralement (les libellés peuvent varier légèrement
// selon la configuration de ton formulaire — la reconnaissance se fait par mots-clés).
const ALIAS: Record<string, string[]> = {
  id: ['id', 'commande', 'n° de commande', 'numero de commande'],
  nom: ['nom'],
  prenom: ['prénom', 'prenom'],
  email: ['email', 'e-mail', 'mail'],
  telephone: ['téléphone', 'telephone', 'tél', 'tel'],
  evenement: ['événement', 'evenement', 'session', 'date de la séance', 'atelier'],
  couleur: ['couleur', 'couleur souhaitée'],
  cookie: ['cookie', 'parfum du cookie', 'parfum'],
  photo: ['photo', 'autorisation photo', 'droit à l\'image']
}

function trouveColonne(headers: string[], cles: string[]): string | undefined {
  const norm = (s: string) => s.toLowerCase().trim()
  return headers.find((h) => cles.some((c) => norm(h).includes(c)))
}

export interface ResultatImport {
  total: number
  importees: number
  doublons: number
  erreurs: string[]
}

export async function importerCsvBilletweb(fichier: File, atelierIdParDefaut: string, typeAtelierId: string): Promise<ResultatImport> {
  const texte = await fichier.text()
  const parsed = Papa.parse<Record<string, string>>(texte, { header: true, skipEmptyLines: true })
  const headers = parsed.meta.fields ?? []

  const col = {
    id: trouveColonne(headers, ALIAS.id),
    nom: trouveColonne(headers, ALIAS.nom),
    prenom: trouveColonne(headers, ALIAS.prenom),
    email: trouveColonne(headers, ALIAS.email),
    telephone: trouveColonne(headers, ALIAS.telephone),
    couleur: trouveColonne(headers, ALIAS.couleur),
    cookie: trouveColonne(headers, ALIAS.cookie),
    photo: trouveColonne(headers, ALIAS.photo)
  }

  const resultat: ResultatImport = { total: parsed.data.length, importees: 0, doublons: 0, erreurs: [] }
  const colonnesReconnues = new Set(Object.values(col).filter(Boolean))

  for (const ligne of parsed.data) {
    const email = col.email ? ligne[col.email] : undefined
    if (!email) { resultat.erreurs.push('Ligne sans email ignorée'); continue }

    // Identifiant anti-doublon : l'id billetweb si présent, sinon une empreinte email+atelier
    const sourceId = col.id && ligne[col.id] ? `csv-${ligne[col.id]}` : `csv-${email}-${atelierIdParDefaut}`

    const { data: existant } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('source_billetweb_id', sourceId)
      .maybeSingle()
    if (existant) { resultat.doublons++; continue }

    let { data: participante } = await supabase.from('participantes').select('id').eq('email', email).maybeSingle()
    if (!participante) {
      const { data: nouvelle } = await supabase
        .from('participantes')
        .insert({
          nom: col.nom ? ligne[col.nom] : '',
          prenom: col.prenom ? ligne[col.prenom] : '',
          email,
          telephone: col.telephone ? ligne[col.telephone] : null
        })
        .select('id')
        .single()
      participante = nouvelle
    }

    const { data: inscription } = await supabase
      .from('inscriptions')
      .insert({
        participante_id: participante!.id,
        atelier_id: atelierIdParDefaut,
        statut: 'Confirmée',
        couleur_choisie: col.couleur ? ligne[col.couleur] : null,
        cookie_choisi: col.cookie ? ligne[col.cookie] : null,
        photo_autorisee: col.photo ? /oui|yes|autoris/i.test(ligne[col.photo] ?? '') : null,
        source_billetweb_id: sourceId
      })
      .select('id')
      .single()

    // Toute colonne non reconnue est conservée telle quelle dans les réponses de formulaire
    if (inscription) {
      const autres = headers
        .filter((h: string) => !colonnesReconnues.has(h) && ligne[h])
        .map((h: string) => ({ inscription_id: inscription.id, question: h, reponse: ligne[h] }))
      if (autres.length) await supabase.from('reponses_formulaire').insert(autres)

      await reserverPack(typeAtelierId, inscription.id)
    }

    resultat.importees++
  }

  return resultat
}
