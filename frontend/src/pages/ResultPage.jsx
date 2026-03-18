import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import WordHighlighter from '../components/WordHighlighter'
import { isRtlLanguage } from '../constants'

/**
 * ResultPage
 * ----------
 * Displays the pronunciation analysis returned by the backend.
 *
 * Data is read from sessionStorage:
 *   analysisResult – JSON from POST /analyze-pronunciation
 *   spokenText     – the user's raw transcript
 *   practiceText   – the original paragraph
 */
export default function ResultPage() {
  const navigate = useNavigate()
  const [result, setResult]   = useState(null)
  const [spoken, setSpoken]   = useState('')
  const [original, setOriginal] = useState('')
  const [language, setLanguage] = useState('en-US')

  useEffect(() => {
    const raw = sessionStorage.getItem('analysisResult')
    if (!raw) { navigate('/'); return }
    setResult(JSON.parse(raw))
    setSpoken(sessionStorage.getItem('spokenText')   || '')
    setOriginal(sessionStorage.getItem('practiceText') || '')
    setLanguage(sessionStorage.getItem('language') || 'en-US')
  }, [navigate])

  if (!result) return null

  const textDirection = isRtlLanguage(language) ? 'rtl' : 'ltr'

  // Map fluency rating to a colour token for the badge
  const ratingColor = {
    Excellent: 'green',
    Good:      'blue',
    Average:   'amber',
    'Needs Practice': 'red',
  }[result.fluency_rating] || 'blue'

  const ratingEmoji = {
    Excellent: '🏆',
    Good:      '👍',
    Average:   '📈',
    'Needs Practice': '💪',
  }[result.fluency_rating] || '📊'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Rating Display */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{ratingEmoji}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {result.fluency_rating}
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            You spoke {result.words_spoken}/{result.total_words} words correctly
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '🎯', label: 'Accuracy', value: `${result.accuracy}%` },
            { icon: '✅', label: 'Correct', value: result.correct_words.length },
            { icon: '❌', label: 'Wrong', value: result.wrong_words.length },
            { icon: '⚡', label: 'Speed', value: `${result.speaking_speed} w/m` }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 shadow-md border border-slate-200">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="text-xs font-semibold text-slate-600 uppercase">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Word-by-Word Breakdown */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Word-by-Word</h2>
          <WordHighlighter wordComparison={result.word_comparison} dir={textDirection} />
        </div>

        {/* Words to Practice */}
        {result.wrong_words.length > 0 && (
          <div className="bg-orange-50 rounded-xl shadow-md border border-orange-200 p-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              💪 Words to Practice
            </h2>
            <div className="flex flex-wrap gap-3">
              {result.wrong_words.map((w, i) => (
                <span key={i} className="bg-white border border-orange-300 text-orange-600 font-semibold rounded-full px-4 py-2 text-sm">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text Comparison */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl shadow-md border border-blue-200 p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-3">📄 Original</h3>
            <p dir={textDirection} className={`text-slate-700 text-sm leading-relaxed ${textDirection === 'rtl' ? 'text-right' : 'text-left'}`}>
              {original || '—'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-3">🎤 Your Speech</h3>
            <p dir={textDirection} className={`text-slate-700 text-sm leading-relaxed ${textDirection === 'rtl' ? 'text-right' : 'text-left'}`}>
              {spoken || '—'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/practice')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all text-base border border-blue-700"
          >
            Try Another
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-all text-base border border-slate-700"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  )
}
