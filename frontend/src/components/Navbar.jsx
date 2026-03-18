import { Link, useLocation } from 'react-router-dom'
import { FaMicrophone, FaHome, FaGamepad, FaUser, FaLock } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

/**
 * Navbar – top navigation bar with links to all major pages.
 */
export default function Navbar() {
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuth()

  const links = [
    { to: '/home',     icon: FaHome, label: 'Home' },
    { to: '/practice', icon: FaMicrophone, label: 'Practice' },
    { to: '/game',     icon: FaGamepad, label: 'Levels' },
    { to: '/profile',  icon: FaUser, label: 'Profile' },
  ]

  return (
    <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 font-black text-xl text-white hover:text-blue-300 transition-colors">
          <img src="/speakbloom-logo.png" alt="SpeakBloom" className="w-8 h-8 rounded-lg" />
          <span className="hidden md:inline">SpeakBloom</span>
        </Link>

        {/* Nav links - Only when authenticated */}
        <div className="flex gap-1 items-center">
          {isAuthenticated ? (
            links.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm md:text-base font-semibold transition-all flex items-center gap-2
                  ${pathname === to
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                title={label}
              >
                <Icon className="text-lg" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))
          ) : (
            <div className="text-slate-300 font-semibold px-4 py-2 flex items-center gap-2">
              <FaLock className="text-lg" /> Sign in
            </div>
          )}
        </div>
      </div>

    </nav>
  )
}
