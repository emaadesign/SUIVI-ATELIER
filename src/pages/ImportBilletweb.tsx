import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { importerCsvBilletweb } from '../lib/csvImport'

export default function ImportBilletweb() {
  const [ateliers, setAteliers] = useState<any[]>([])
  const [atelierChoisi, setAtelierChoisi] = useState('')
  const [fichier, setFichier] = useState<File | null>(null)
  const [resultat, setResultat] = useState<string | null>(null)
  const [synchroEnCours, setSynchroEnCours] = useState(false)

  useEffect(() => {
    supabase.from('ateliers').select('id, date, type_atelier_id, types_ateliers(nom)').order('date', { ascending: false })
      .then(({ data }) => setAteliers(data ?? []))
  }, [])

  async function synchroniser() {
    setSynchroEnCours(true)
    setResultat(null)
    const { data, error } = await supabase.functions.invoke('sync-billetweb')
    setSynchroEnCours(false)
    if (error) setResultat("Erreur de connexion a Billetweb")
    else if (data?.error) setResultat(`Erreur : ${data.error}`)
    else setResultat(`${data.nouvellesInscriptions} nouvelle(s) inscription(s), ${data.doublonsIgnores} deja connue(s)`)
  }

  async function importerFichier() {
    if (!fichier || !atelierChoisi) return
    const atelier = ateliers.find((a) => a.id === atelierChoisi)
    setResultat('Import en cours...')
    const res = await importerCsvBilletweb(fichier, atelierChoisi, atelier.type_atelier_id)
    setResultat(`${res.importees} importee(s), ${res.doublons} deja connue(s) sur ${res.total} lignes.`)
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Import Billetweb</h1>
      <p className="text-plum/60 mb-4">Synchronisation automatique ou import manuel</p>

      <div className="card mb-4">
        <p className="font-semibold text-plum mb-2">Synchronisation API</p>
        <p className="text-sm text-plum/60 mb-3">Recupere automatiquement les nouvelles inscriptions depuis Billetweb (aucun doublon cree).</p>
        <button className="btn-primary w-full" onClick={synchroniser} disabled={synchroEnCours}>
          {synchroEnCours ? 'Synchronisation...' : 'Synchroniser maintenant'}
        </button>
      </div>

      <div className="card">
        <p className="font-semibold text-plum mb-2">Import CSV / Excel (secours)</p>
        <p className="text-sm text-plum/60 mb-3">A utiliser si l'API n'est pas disponible, ou pour forcer une synchronisation immediate.</p>

        <select className="input mb-2" value={atelierChoisi} onChange={(e) => setAtelierChoisi(e.target.value)}>
          <option value="">Choisir l'atelier concerne</option>
          {ateliers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.types_ateliers?.nom} - {new Date(a.date).toLocaleDateString('fr-FR')}
            </option>
          ))}
        </select>
        <input className="input mb-2" type="file" accept=".csv" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
        <button className="btn-secondary w-full" onClick={importerFichier} disabled={!fichier || !atelierChoisi}>
          Importer le fichier
        </button>
      </div>

      {resultat && <div className="card mt-4 text-sm">{resultat}</div>}
    </div>
  )
}
