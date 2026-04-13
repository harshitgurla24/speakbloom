import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaGamepad } from 'react-icons/fa'
import { LANGUAGES } from '../constants'

const TOTAL_LEVELS = 20

function getProgressKey(language) {
  return `speakbloom_game_unlocked_level_${language}`
}

function getUnlockedLevelForLanguage(language) {
  const stored = Number(localStorage.getItem(getProgressKey(language)) || '1')
  return Number.isNaN(stored) ? 1 : Math.min(Math.max(stored, 1), TOTAL_LEVELS)
}

function progressPercentage(unlockedLevel) {
  return Math.round((unlockedLevel / TOTAL_LEVELS) * 100)
}

export default function GamePage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(sessionStorage.getItem('gameLanguage') || sessionStorage.getItem('language') || 'en-US')
  const [unlockedLevel, setUnlockedLevel] = useState(() => getUnlockedLevelForLanguage(language))

  const levels = useMemo(
    () => Array.from({ length: TOTAL_LEVELS }, (_, index) => index + 1),
    []
  )

  const handleLanguageChange = (value) => {
    setLanguage(value)
    sessionStorage.setItem('gameLanguage', value)
    setUnlockedLevel(getUnlockedLevelForLanguage(value))
  }

  const openLevel = (levelNumber) => {
    if (levelNumber > unlockedLevel) {
      return
    }
    sessionStorage.setItem('gameLanguage', language)
    navigate(`/game/level/${levelNumber}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FaGamepad className="text-3xl text-blue-600 animate-bounce" style={{animationDelay: '0s'}} />
            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-center">
              Select Your Level
            </h1>
            <FaGamepad className="text-3xl text-purple-600 animate-bounce" style={{animationDelay: '0.2s'}} />
          </div>
          <p className="text-slate-600 text-sm font-medium text-center">
            Unlock all 20 levels
          </p>
        </div>

        {/* Language Selector Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="w-full max-w-sm">
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Pick a Language
              </label>
              <select
                value={language}
                onChange={(event) => handleLanguageChange(event.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 font-medium
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer
                           hover:border-slate-400 transition-all"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Badge */}
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl px-4 py-3 border-2 border-white shadow-lg">
              <p className="text-xs text-white font-bold uppercase tracking-widest mb-1">Progress</p>
              <p className="text-2xl font-black text-white drop-shadow">
                Level {Math.min(unlockedLevel, TOTAL_LEVELS)}/{TOTAL_LEVELS}
              </p>
              <div className="h-2 rounded-full bg-white/30 mt-2 overflow-hidden border border-white">
                <div
                  className="h-full bg-yellow-300 transition-all duration-500 shadow-lg"
                  style={{ width: `${progressPercentage(unlockedLevel)}%` }}
                />
              </div>
              <p className="text-xs text-white font-bold mt-1">
                {progressPercentage(unlockedLevel)}% Complete
              </p>
            </div>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-2 border-white p-6">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 mb-4 flex items-center gap-2">
            ⭐ Select Your Level
          </h2>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
            {levels.map((levelNumber) => {
              const isLocked = levelNumber > unlockedLevel
              const isDone = levelNumber < unlockedLevel
              const isCurrent = levelNumber === unlockedLevel

              return (
                <button
                  key={levelNumber}
                  disabled={isLocked}
                  onClick={() => openLevel(levelNumber)}
                  className={`rounded-2xl h-16 font-black transition-all border-3 text-lg transform
                    ${isLocked
                      ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400 border-slate-300 cursor-not-allowed opacity-50'
                      : isDone
                        ? 'bg-gradient-to-br from-green-300 to-emerald-400 text-white border-white hover:scale-110'
                        : isCurrent
                          ? 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white border-white scale-110 hover:scale-125 animate-pulse'
                          : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white border-white hover:scale-110'
                    }`}
                >
                  <span className="block drop-shadow">
                    {isLocked ? '🔒' : isDone ? '✅' : isCurrent ? '🎯' : '⭐'}
                  </span>
                  <span className="text-sm drop-shadow block">{levelNumber}</span>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t-3 border-slate-200">
            {[
              { emoji: '⭐', label: 'Available', color: 'blue' },
              { emoji: '🎯', label: 'Current Level', color: 'yellow' },
              { emoji: '✅', label: 'Completed', color: 'green' },
              { emoji: '🔒', label: 'Locked', color: 'gray' }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`text-3xl`}>{item.emoji}</div>
                <span className="font-bold text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-custom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse-custom 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
