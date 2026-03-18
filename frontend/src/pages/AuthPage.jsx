import { useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const navigate = useNavigate()
  const {
    isAuthenticated,
    isAuthLoading,
    authError,
    setAuthError,
    loginWithGoogleCredential,
    hasGoogleClientId,
    user,
  } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            SpeakBloom
          </h1>
          <p className="text-sm text-slate-600 font-medium mb-2">
            Master pronunciation with AI
          </p>
          <p className="text-slate-600 text-xs">
            Learn 12 languages
          </p>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/speakbloom-logo.png" alt="SpeakBloom" className="w-24 h-24 rounded-2xl shadow-lg" />
        </div>

        {/* Features showcase */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {[
            { text: '20-Level Game' },
            { text: 'Score Tracking' },
            { text: 'Achievements' },
            { text: '12 Languages' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="font-semibold text-slate-700 text-xs">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Auth Card */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-4 border-white p-8 transform hover:scale-105 transition-transform">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">👋</div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500">
              Welcome Back!
            </h2>
            <p className="text-slate-600 text-sm mt-2">Sign in to unlock all languages 🔓</p>
          </div>

          {isAuthLoading ? (
            <div className="rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 px-4 py-4 text-center font-semibold text-blue-700">
              ⏳ Checking your session…
            </div>
          ) : isAuthenticated ? (
            <div className="rounded-2xl bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 px-4 py-4 text-center">
              <p className="text-green-700 font-bold">✅ Signed in as</p>
              <p className="text-green-800 font-black">{user?.name || user?.email}</p>
            </div>
          ) : hasGoogleClientId ? (
            <div className="flex justify-center mb-4">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  loginWithGoogleCredential(credentialResponse.credential)
                }}
                onError={() => {
                  setAuthError('Google sign-in popup failed. Please try again.')
                }}
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-400 px-4 py-3 text-sm text-orange-800">
              ⚙️ Google login not configured. Set <strong>VITE_GOOGLE_CLIENT_ID</strong> in frontend environment.
            </div>
          )}

          {authError && (
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-red-200 to-pink-200 border-2 border-red-400 text-red-800 px-4 py-3 text-sm font-semibold animate-shake">
              ❌ {authError}
            </div>
          )}
        </div>

        {/* Fun footer */}
        <div className="text-center mt-8 text-white drop-shadow">
          <p className="text-sm font-bold">🚀 Get ready to improve your pronunciation skills!</p>
          <p className="text-xs mt-2 opacity-90">Have fun while learning 🎈✨</p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
