import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ITEMS = [
  { to: '/calendrier', label: 'Calendrier', icon: '📅' },
  { to: '/messages', label: 'Messages & rappels', icon: '📩' },
  { to: '/import', label: 'Import Billetweb', icon: '🔄' },
  { to: '/export', label: 'Export', icon: '📤' },
  { to: '/parametres', label: 'Paramètres', icon: '⚙️' }
]

export default function Plus() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="page-title">Plus</h1>
      <div className="space-y-2 mt-4">
        {ITEMS.map((item) => (
          <Link to={item.to} key={item.to} className="card flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            <span className="font-semibold text-plum">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => supabase.auth.signOut()}
          className="card flex items-center gap-3 w-full text-left text-clay"
        >
          <span className="text-xl">🚪</span>
          <span className="font-semibold">Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
