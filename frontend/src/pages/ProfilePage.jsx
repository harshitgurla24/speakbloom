import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LANGUAGES } from '../constants'
import { useAuth } from '../context/AuthContext'

const TOTAL_LEVELS = 20

function getProgressKey(languageCode) {
  return `speakbloom_game_unlocked_level_${languageCode}`
}

function getUnlockedLevel(languageCode) {
  const raw = Number(localStorage.getItem(getProgressKey(languageCode)) || '1')
  if (Number.isNaN(raw)) return 1
  return Math.min(Math.max(raw, 1), TOTAL_LEVELS)
}

function progressPercent(unlockedLevel) {
  return Math.round((unlockedLevel / TOTAL_LEVELS) * 100)
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const languageProgress = useMemo(
    () => LANGUAGES.map((language) => {
      const unlockedLevel = getUnlockedLevel(language.code)
      return {
        ...language,
        unlockedLevel,
        completedLevels: Math.max(unlockedLevel - 1, 0),
        percent: progressPercent(unlockedLevel),
      }
    }),
    []
  )

  const overallProgress = useMemo(() => {
    const completed = languageProgress.reduce((sum, item) => sum + item.completedLevels, 0)
    const total = LANGUAGES.length * TOTAL_LEVELS
    const percent = Math.round((completed / total) * 100)
    return { completed, total, percent }
  }, [languageProgress])

  // Calculate achievements
  const achievements = {
    totalCompleted: languageProgress.filter(l => l.unlockedLevel > 1).length,
    perfectLanguages: languageProgress.filter(l => l.unlockedLevel === TOTAL_LEVELS + 1).length,
    totalLevels: languageProgress.reduce((sum, l) => sum + l.completedLevels, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user?.name || 'Profile'}
                    className="w-16 h-16 rounded-full border-2 border-slate-300 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-slate-300 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white text-sm">
                  ✓
                </div>
              </div>
              <div>
                <p className="uppercase tracking-widest text-xs font-bold text-purple-600 mb-1">Welcome</p>
                <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500">
                  {user?.name || 'Champion'}
                </h1>
                <p className="text-slate-600 font-bold text-lg mt-1">{user?.email || 'No email'}</p>
              </div>
            </div>

            {/* Overall Progress Badge */}
            <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-3xl px-8 py-6 border-4 border-white shadow-2xl text-center">
              <p className="text-sm uppercase tracking-widest text-white font-black mb-2">🏆 Overall Progress</p>
              <p className="text-5xl font-black text-white drop-shadow">{overallProgress.percent}%</p>
              <p className="text-white font-bold text-lg mt-2">
                {overallProgress.completed}/{overallProgress.total} Levels
              </p>
              <div className="h-4 rounded-full bg-white/30 mt-4 overflow-hidden border-2 border-white">
                <div 
                  className="h-full bg-yellow-300 transition-all duration-700 shadow-lg" 
                  style={{ width: `${overallProgress.percent}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-4 border-white p-8 mb-8">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600 mb-4 flex items-center gap-2">
            🎖️ Your Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🎯', label: 'Languages Started', value: achievements.totalCompleted, color: 'from-blue-400 to-cyan-500' },
              { icon: '🏅', label: 'Perfect Languages', value: achievements.perfectLanguages, color: 'from-yellow-400 to-orange-500' },
              { icon: '⭐', label: 'Total Levels Passed', value: achievements.totalLevels, color: 'from-purple-400 to-pink-500' }
            ].map((badge, idx) => (
              <div 
                key={idx} 
                className={`bg-gradient-to-br ${badge.color} rounded-2xl p-4 text-white border-2 border-white shadow-lg transform hover:scale-110 transition-all`}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-90">{badge.label}</p>
                <p className="text-2xl font-black drop-shadow mt-1">{badge.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Language Progress Section */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-2 border-white p-6 mb-6">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4 flex items-center gap-2">
            🌍 Language-wise Progress
          </h2>
          <p className="text-slate-600 font-bold mb-6 text-lg">Each language has 20 levels - click cards to play! 🎮</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {languageProgress.map((item, idx) => (
              <button
                key={item.code}
                onClick={() => {
                  sessionStorage.setItem('gameLanguage', item.code)
                  navigate('/game')
                }}
                className="rounded-2xl border-4 border-white bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-left hover:from-yellow-50 hover:to-orange-50 hover:border-yellow-400 hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:scale-110 hover:-rotate-1"
                style={{animationDelay: `${idx * 50}ms`}}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-black text-xl text-slate-800 group-hover:text-orange-700 transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 font-bold mt-1">Code: {item.code}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-black px-3 py-2 rounded-full text-sm shadow-lg border-2 border-white group-hover:from-orange-400 group-hover:to-yellow-500 transition-all">
                    {item.completedLevels}/{TOTAL_LEVELS}
                  </div>
                </div>

                {/* Level Info */}
                <div className="bg-white/60 rounded-xl p-3 mb-3 border-2 border-slate-200 group-hover:border-orange-300 group-hover:bg-orange-50/60 transition-all">
                  <p className="text-sm font-bold text-slate-600 group-hover:text-orange-700">
                    📈 Current Level: <span className="text-lg text-blue-700 group-hover:text-orange-700">{item.unlockedLevel}</span>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="h-3 rounded-full bg-slate-300 overflow-hidden mb-3 border-2 border-slate-400">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 shadow-lg" 
                    style={{ width: `${item.percent}%` }} 
                  />
                </div>
                <p className="text-xs font-black text-slate-600 group-hover:text-orange-700">
                  {item.percent}% Complete 🎯
                </p>

                {/* Status Badge */}
                <div className="mt-4 pt-3 border-t-2 border-slate-200">
                  {item.unlockedLevel === TOTAL_LEVELS + 1 ? (
                    <span className="inline-block bg-gradient-to-r from-yellow-300 to-orange-400 text-slate-800 font-black px-3 py-1 rounded-full text-xs border-2 border-white">
                      🏆 Completed!
                    </span>
                  ) : item.unlockedLevel > 1 ? (
                    <span className="inline-block bg-gradient-to-r from-blue-300 to-purple-400 text-white font-black px-3 py-1 rounded-full text-xs border-2 border-white">
                      🚀 In Progress
                    </span>
                  ) : (
                    <span className="inline-block bg-gradient-to-r from-slate-300 to-slate-400 text-slate-700 font-black px-3 py-1 rounded-full text-xs border-2 border-white">
                      ⭐ Not Started
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => {
              logout()
              navigate('/', { replace: true })
            }}
            className="bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white font-black py-5 px-12
                       rounded-3xl transition-all transform hover:scale-110 text-xl border-4 border-white
                       active:scale-95"
          >
            👋 Logout & See You Soon!
          </button>
        </div>
      </div>
    </div>
  )
}
