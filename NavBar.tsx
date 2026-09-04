import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/ateliers', label: 'Ateliers', icon: '🧶' },
  { to: '/participantes', label: 'Participantes', icon: '👩' },
  { to: '/stocks', label: 'Stocks', icon: '📦' },
  { to: '/plus', label: 'Plus', icon: '⋯' }
]

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-light flex justify-around py-2 pb-safe z-20">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium rounded-soft ${
              isActive ? 'text-rose' : 'text-plum/50'
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
