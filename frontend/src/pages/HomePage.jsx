import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaMicrophone, FaGamepad, FaLanguage, FaSliders, FaTrophy } from 'react-icons/fa6'
import { LANGUAGES, TEXT_LENGTHS, LEVELS } from '../constants'
import apiClient, { apiKeyMethods } from '../apiClient'
import Loader from '../components/Loader'
import ApiKeyModal from '../components/ApiKeyModal'

/**
 * HomePage
 * --------
 * Allows the user to:
 *   1. Select a language
 *   2. Choose a text length
 *   3. Generate a practice paragraph via the backend
 *   4. Navigate to either the Practice or Listening page
 */
export default function HomePage() {
  const navigate = useNavigate()

  const [language, setLanguage]     = useState('en-US')
  const [length, setLength]         = useState('medium')
  const [level, setLevel]           = useState('easy')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  
  // API Key Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  // Check API key status on mount
  useEffect(() => {
    const checkApiKeyStatus = async () => {
      try {
        const response = await apiKeyMethods.getStatus()
        setHasApiKey(response.data.has_api_key)
      } catch (error) {
        console.log('Could not check API key status')
      }
    }
    checkApiKeyStatus()
  }, [isModalOpen])

  /**
   * Calls POST /generate-text, stores the result in sessionStorage,
   * then navigates to the chosen destination page.
   */
  const handleGenerate = async (destination) => {
    setError('')
    
    // Check if user has API key
    if (!hasApiKey) {
      setError('🔑 Please add your Groq API key first!')
      return
    }
    
    setLoading(true)
    try {
      const { data } = await apiClient.post('/generate-text', {
        language,
        length,
        level,
      })

      // Store everything the downstream pages need in sessionStorage
      sessionStorage.setItem('practiceText', data.text)
      sessionStorage.setItem('language',     data.language)
      sessionStorage.setItem('length',       data.length)
      sessionStorage.setItem('level',        data.level)

      navigate(destination)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Failed to connect to the backend. Make sure the FastAPI server is running on port 8000.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      {/* Animated background elements */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div> */}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FaMicrophone className="text-3xl text-blue-600 animate-bounce" style={{animationDelay: '0s'}} />
            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Master Your Accent
            </h1>
            <FaTrophy className="text-3xl text-yellow-500 animate-bounce" style={{animationDelay: '0.2s'}} />
          </div>
          <p className="text-base text-slate-600 font-semibold mb-2">
            Improve your pronunciation in 12 languages with AI feedback
          </p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <div className="bg-white rounded-lg px-3 py-1 shadow-md border-2 border-blue-200">
              <span className="text-xs font-bold text-slate-700">🎮 20 Levels</span>
            </div>
            <div className="bg-white rounded-lg px-3 py-1 shadow-md border-2 border-purple-200">
              <span className="text-xs font-bold text-slate-700">📊 Real-time Feedback</span>
            </div>
            <div className="bg-white rounded-lg px-3 py-1 shadow-md border-2 border-pink-200">
              <span className="text-xs font-bold text-slate-700">🌍 12 Languages</span>
            </div>
          </div>
        </div>

        {/* Configuration Cards - Enhanced */}
        <div className="space-y-5 mb-8">
          {/* Language Selector */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <FaLanguage className="text-2xl text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Language</h2>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-blue-300 rounded-xl px-3 py-2 text-slate-700 text-sm font-semibold
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gradient-to-r from-blue-50 to-transparent
                         cursor-pointer hover:border-blue-500 transition-all"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Text Length Card */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <FaSliders className="text-2xl text-orange-600" />
              <h2 className="text-lg font-bold text-slate-800">How Long?</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TEXT_LENGTHS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLength(opt.value)}
                  className={`py-3 px-2 rounded-xl border-2 font-bold transition-all duration-200 transform text-sm ${
                    length === opt.value
                      ? 'bg-gradient-to-br from-orange-400 to-yellow-500 text-white border-orange-600 scale-105 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-orange-400 hover:bg-orange-50'
                  } active:scale-95`}
                >
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level Card */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <FaGamepad className="text-2xl text-purple-600" />
              <h2 className="text-lg font-bold text-slate-800">Difficulty</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLevel(opt.value)}
                  className={`py-3 px-2 rounded-xl border-2 font-bold transition-all duration-200 transform text-center ${
                    level === opt.value
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white border-purple-700 scale-105 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400 hover:bg-purple-50'
                  } active:scale-95`}
                >
                  <span className="text-2xl block mb-1">{opt.emoji}</span>
                  <span className="text-xs block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-400 text-red-800 px-4 py-3 text-center font-bold shadow-lg animate-pulse text-sm flex items-center justify-between gap-3">
              <span>⚠️ {error}</span>
              {error.includes('API key') && (
                <button
                  onClick={() => {
                    setError('')
                    setIsModalOpen(true)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg transition-all text-xs whitespace-nowrap"
                >
                  Add Now
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {loading ? (
            <Loader message="Generating your practice text…" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => handleGenerate('/practice')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6
                           rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg border-2 border-green-700
                           flex items-center justify-center gap-2 text-base"
              >
                <FaMicrophone className="text-lg" />
                Start Practice
              </button>

              <button
                onClick={() => navigate('/game')}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6
                           rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg border-2 border-blue-800
                           flex items-center justify-center gap-2 text-base"
              >
                <FaGamepad className="text-lg" />
                Play Levels
              </button>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200">
          <h3 className="text-center text-slate-700 font-bold mb-3 text-sm">Why Choose Us?</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: '🎯', text: 'Accurate Feedback' },
              { icon: '⚡', text: 'Real-time Detection' },
              { icon: '📈', text: 'Track Progress' },
              { icon: '🏆', text: '20 Challenging Levels' },
              { icon: '🌐', text: '12 Languages' },
              { icon: '💪', text: 'Get Better Daily' }
            ].map((f) => (
              <div
                key={f.text}
                className="bg-white rounded-lg p-3 text-center shadow-md border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                <span className="text-2xl block mb-1">{f.icon}</span>
                <span className="text-xs font-semibold text-slate-700">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Key Modal */}
        <ApiKeyModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setHasApiKey(true)}
        />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
