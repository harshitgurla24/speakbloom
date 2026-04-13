import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FaMicrophone, FaHome, FaGamepad, FaUser, FaLock, FaShieldAlt } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { apiKeyMethods, adminMethods } from '../apiClient'
import ApiKeyModal from './ApiKeyModal'

/**
 * Navbar – top navigation bar with links to all major pages.
 */
export default function Navbar() {
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check API key status and admin status on mount and when modal closes
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await apiKeyMethods.getStatus()
        setHasApiKey(response.data.has_api_key)
      } catch (error) {
        console.log('Could not check API key status')
      }
      
      // Check if user is admin
      try {
        const response = await adminMethods.getStats()
        console.log('✅ Admin access granted! Stats:', response.data)
        setIsAdmin(true)
      } catch (error) {
        console.log('❌ Not admin or error:', error.response?.status, error.response?.data?.detail)
        setIsAdmin(false)
      }
    }
    
    if (isAuthenticated) {
      console.log('🔐 Checking admin status...')
      checkStatus()
    }
  }, [isModalOpen, isAuthenticated])

  const links = [
    { to: '/home',     icon: FaHome, label: 'Home' },
    { to: '/practice', icon: FaMicrophone, label: 'Practice' },
    { to: '/game',     icon: FaGamepad, label: 'Levels' },
    { to: '/profile',  icon: FaUser, label: 'Profile' },
  ]
  
  const adminLinks = [
    { to: '/admin', icon: FaShieldAlt, label: 'Admin' },
  ]

  return (
    <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 font-black text-xl text-white hover:text-blue-300 transition-colors">
          <img src="/speakbloom-logo.png" alt="SpeakBloom" className="w-14 h-14 rounded-lg" />
          <span className="hidden md:inline">SpeakBloom</span>
        </Link>

        {/* Nav links - Only when authenticated */}
        <div className="flex gap-1 items-center">
          {isAuthenticated ? (
            <>
              {links.map(({ to, icon: Icon, label }) => (
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
              ))}
              
              {/* Admin link - Only show for admins */}
              {isAdmin && adminLinks.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-lg text-sm md:text-base font-semibold transition-all flex items-center gap-2
                    ${pathname === to
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-red-700'
                    }`}
                  title={label}
                >
                  <Icon className="text-lg" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              ))}
              
              {/* API Key Button - Only show if user hasn't added API key yet */}
              {!hasApiKey && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="ml-2 px-3 py-2 rounded-lg text-sm md:text-base font-semibold transition-all flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                  title="Add Groq API Key"
                >
                  <span>🔑</span>
                  <span className="hidden lg:inline">Add API</span>
                </button>
              )}
            </>
          ) : (
            <div className="text-slate-300 font-semibold px-4 py-2 flex items-center gap-2">
              <FaLock className="text-lg" /> Sign in
            </div>
          )}
        </div>

        {/* API Key Modal */}
        <ApiKeyModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setHasApiKey(true)}
        />
      </div>

    </nav>
  )
}
