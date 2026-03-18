import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecognitionLanguage, isRtlLanguage } from '../constants'
import Loader from '../components/Loader'
import apiClient from '../apiClient'
import { FaMicrophone, FaGamepad, FaCheck, FaTimes } from 'react-icons/fa'

const TOTAL_LEVELS = 20

function getProgressKey(language) {
  return `speakbloom_game_unlocked_level_${language}`
}

function getUnlockedLevelForLanguage(language) {
  const stored = Number(localStorage.getItem(getProgressKey(language)) || '1')
  return Number.isNaN(stored) ? 1 : Math.min(Math.max(stored, 1), TOTAL_LEVELS)
}

function normalizeWord(word) {
  return word
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, '')
}

function getLevelConfig(levelNumber) {
  if (levelNumber <= 5) return { length: 'short', level: 'easy' }
  if (levelNumber <= 10) return { length: 'medium', level: levelNumber <= 7 ? 'easy' : 'medium' }
  if (levelNumber <= 15) return { length: 'medium', level: levelNumber <= 13 ? 'medium' : 'hard' }
  return { length: 'long', level: 'hard' }
}

function LiveTextHighlighter({ originalText, spokenWords, active }) {
  const tokens = useMemo(() => {
    const result = []
    const regex = /(\S+)(\s*)/g
    let match
    while ((match = regex.exec(originalText)) !== null) {
      result.push({ word: match[1], space: match[2] })
    }
    return result
  }, [originalText])

  const normalizedSpoken = useMemo(() => spokenWords.map(normalizeWord).filter(Boolean), [spokenWords])

  const statuses = useMemo(() => {
    const normalizedOriginal = tokens.map((token) => normalizeWord(token.word))
    const result = new Array(tokens.length).fill('pending')
    let originalIndex = 0
    let spokenIndex = 0

    while (originalIndex < normalizedOriginal.length && spokenIndex < normalizedSpoken.length) {
      const originalWord = normalizedOriginal[originalIndex]
      const spokenWord = normalizedSpoken[spokenIndex]

      if (!originalWord) {
        originalIndex += 1
        continue
      }

      if (spokenWord === originalWord) {
        result[originalIndex] = 'correct'
        originalIndex += 1
        spokenIndex += 1
        continue
      }

      const nextSpoken = normalizedSpoken[spokenIndex + 1]
      const nextOriginal = normalizedOriginal[originalIndex + 1]

      if (nextSpoken && nextSpoken === originalWord) {
        spokenIndex += 1
        continue
      }
      if (nextOriginal && spokenWord === nextOriginal) {
        result[originalIndex] = 'wrong'
        originalIndex += 1
        continue
      }

      result[originalIndex] = 'wrong'
      originalIndex += 1
      spokenIndex += 1
    }

    const currentIndex = result.findIndex((status) => status === 'pending')
    if (active && currentIndex >= 0) result[currentIndex] = 'current'
    return result
  }, [tokens, normalizedSpoken, active])

  return (
    <p className="text-lg leading-relaxed tracking-wide">
      {tokens.map(({ word, space }, index) => {
        const status = statuses[index]
        const cls = {
          correct: 'text-green-600 font-semibold',
          wrong: 'text-red-500 font-semibold underline decoration-wavy decoration-red-400',
          current: 'text-blue-600 font-semibold underline decoration-2 underline-offset-4 animate-pulse',
          pending: 'text-slate-700',
        }[status]
        return (
          <span key={index}>
            <span className={`transition-colors duration-200 ${cls}`}>{word}</span>
            {space}
          </span>
        )
      })}
    </p>
  )
}

export default function GameLevelPage() {
  const navigate = useNavigate()
  const { levelNumber: levelParam } = useParams()

  const levelNumber = Number(levelParam)
  const gameLanguage = sessionStorage.getItem('gameLanguage') || sessionStorage.getItem('language') || 'en-US'
  const textDirection = isRtlLanguage(gameLanguage) ? 'rtl' : 'ltr'

  const [practiceText, setPracticeText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState(null)

  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)
  const finalRef = useRef('')
  const shouldRestartRef = useRef(false)

  const spokenWords = useMemo(() => {
    const combined = `${transcript} ${interimText}`.trim()
    return combined ? combined.split(/\s+/).filter(Boolean) : []
  }, [transcript, interimText])

  const unlockedLevel = useMemo(() => getUnlockedLevelForLanguage(gameLanguage), [gameLanguage])

  const loadLevelText = async () => {
    if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > TOTAL_LEVELS) {
      navigate('/game')
      return
    }
    if (levelNumber > unlockedLevel) {
      navigate('/game')
      return
    }

    const config = getLevelConfig(levelNumber)
    setIsLoading(true)
    setError('')
    setTranscript('')
    setInterimText('')
    setLastResult(null)
    finalRef.current = ''

    try {
      const { data } = await apiClient.post('/generate-text', {
        language: gameLanguage,
        length: config.length,
        level: config.level,
      })
      setPracticeText(data.text)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not generate level text. Please check that the backend server is running.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLevelText()
  }, [levelNumber])

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  const buildRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Your browser does not support the Web Speech API. Try Chrome or Edge.')
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.lang = getRecognitionLanguage(gameLanguage)
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        if (result.isFinal) finalRef.current += `${result[0].transcript} `
        else interim += result[0].transcript
      }
      setTranscript(finalRef.current)
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted' && !shouldRestartRef.current) {
        return
      }

      if (['no-speech', 'network'].includes(event.error) && shouldRestartRef.current) {
        return
      }

      setError(`Speech recognition error: ${event.error}`)
      shouldRestartRef.current = false
      setIsRecording(false)
    }

    recognition.onend = () => {
      setInterimText('')

      if (shouldRestartRef.current) {
        setTimeout(() => {
          if (!shouldRestartRef.current) return
          try {
            recognition.start()
          } catch {
            // Ignore rapid restart race; next cycle will retry.
          }
        }, 120)
      }
    }
    return recognition
  }

  const startRecording = () => {
    setError('')
    setTranscript('')
    setInterimText('')
    finalRef.current = ''
    shouldRestartRef.current = true

    const recognition = buildRecognition()
    if (!recognition) return

    recognitionRef.current = recognition
    startTimeRef.current = Date.now()
    try {
      recognition.start()
    } catch {
      setError('Unable to start speech recognition. Please try again.')
      shouldRestartRef.current = false
      return
    }
    setIsRecording(true)
  }

  const stopRecording = () => {
    shouldRestartRef.current = false
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }

  const analyzeAttempt = async () => {
    const spokenText = `${transcript} ${interimText}`.trim()
    if (!spokenText) {
      setError('No speech was detected. Please record your voice first.')
      return
    }

    setSubmitting(true)
    setError('')
    const timeTaken = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 1

    try {
      const { data } = await apiClient.post('/analyze-pronunciation', {
        original_text: practiceText,
        spoken_text: spokenText,
        time_taken: timeTaken,
      })

      const passed = data.wrong_words.length <= 3 && data.total_words > 0
      setLastResult({ ...data, passed })

      if (passed && levelNumber === unlockedLevel && unlockedLevel < TOTAL_LEVELS) {
        localStorage.setItem(getProgressKey(gameLanguage), String(unlockedLevel + 1))
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Level analysis failed. Please check that the backend server is running.')
    } finally {
      setSubmitting(false)
    }
  }

  const retryLevel = () => {
    setLastResult(null)
    loadLevelText()
  }

  const nextLevel = () => {
    const next = levelNumber + 1
    if (next > TOTAL_LEVELS) {
      navigate('/game')
      return
    }
    navigate(`/game/level/${next}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate('/game')} 
            className="flex items-center gap-2 font-bold text-slate-700 hover:text-slate-900 transition-all text-lg bg-white px-4 py-2 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <span className="text-slate-900 font-bold text-lg bg-white px-6 py-2 rounded-full border-2 border-blue-300">
            Level {levelNumber} / {TOTAL_LEVELS}
          </span>
        </div>

        {/* Level Header Card */}
        <div className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg mb-6 border-2 border-orange-300 hover:shadow-xl transition-all">
          <div className="flex items-center gap-2 mb-1">
            <FaGamepad className="text-3xl" />
            <h2 className="text-3xl font-black">Level {levelNumber}</h2>
          </div>
          <p className="text-white text-lg font-semibold">
            Speak the text clearly! You can pass with up to 3 wrong words.
          </p>
        </div>

        {/* Practice Text Card */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <FaMicrophone className="text-lg text-blue-600" />
            Read This Text
          </h3>

          {isLoading ? (
            <Loader message="Generating your level text…" />
          ) : (
            <div dir={textDirection} className={`text-xl font-medium leading-relaxed ${textDirection === 'rtl' ? 'text-right' : 'text-left'} bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl border-2 border-slate-200`}>
              <LiveTextHighlighter originalText={practiceText} spokenWords={spokenWords} active={isRecording || spokenWords.length > 0} />
            </div>
          )}

          {(isRecording || spokenWords.length > 0) && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-md"></span>
                <span className="text-sm font-bold text-slate-700">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-md"></span>
                <span className="text-sm font-bold text-slate-700">Wrong</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-md animate-pulse"></span>
                <span className="text-sm font-bold text-slate-700">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 shadow-md"></span>
                <span className="text-sm font-bold text-slate-700">Pending</span>
              </div>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-200 p-6 mb-6">
          <div className="mb-8">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={submitting || isLoading || !!lastResult}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-3 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg border-2 border-red-400"
              >
                <FaMicrophone className="text-2xl" />
                <span>Start Recording</span>
              </button>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={stopRecording}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white font-bold py-3 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-base shadow-lg border-2 border-slate-500 animate-pulse"
                >
                  <span className="text-2xl">⏹️</span>
                  <span>Stop Recording</span>
                </button>
                
                <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-red-300 to-red-400 text-white font-bold px-6 py-4 rounded-2xl border-2 border-red-500 text-center">
                  <span className="w-3 h-3 rounded-full bg-red-700 animate-pulse shadow-md"></span>
                  <span>Recording Live...</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Transcript */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 p-6 mb-6 min-h-[100px]">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Your Voice (Live)</p>
            <p dir={textDirection} className={`text-lg font-semibold leading-relaxed text-slate-800 ${textDirection === 'rtl' ? 'text-right' : 'text-left'}`}>
              {transcript}
              <span className="text-slate-500 italic">{interimText}</span>
              {!transcript && !interimText && <span className="text-slate-400 italic">Start recording to see your speech here...</span>}
            </p>
          </div>

          <button
            onClick={analyzeAttempt}
            disabled={submitting || isRecording || isLoading || (!transcript && !interimText) || !!lastResult}
            className="w-full bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-700 hover:from-purple-600 hover:via-indigo-700 hover:to-blue-800 disabled:from-slate-300 disabled:via-slate-400 disabled:to-slate-500 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-base shadow-lg border-2 border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaCheck className="text-2xl" />
            <span>{submitting ? 'Analyzing Your Speech…' : 'Check My Score!'}</span>
          </button>
        </div>

        {/* Result Display */}
        {lastResult && (
          <div className={`rounded-3xl border-2 border-white p-6 shadow-2xl mb-6 transform
            ${lastResult.passed 
              ? 'bg-gradient-to-br from-green-300 via-emerald-400 to-teal-500' 
              : 'bg-gradient-to-br from-orange-300 via-yellow-400 to-orange-500'}`}
          >
            <div className="text-center mb-6">
              <div className="text-7xl mb-4 drop-shadow-lg">
                {lastResult.passed ? '🎉' : '💪'}
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                {lastResult.passed ? '✅ Level Passed!' : '⚡ Almost There!'}
              </h3>
              <p className="text-white text-lg drop-shadow font-bold mt-2">
                {lastResult.passed 
                  ? `Awesome! You cleared Level ${levelNumber}! 🌟` 
                  : 'To pass, you can only have 3 wrong words. Try again! 🚀'}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: '🎯', label: 'Accuracy', value: `${lastResult.accuracy}%`, color: 'from-yellow-300 to-orange-400' },
                { icon: '✅', label: 'Correct', value: lastResult.correct_words.length, color: 'from-green-300 to-emerald-400' },
                { icon: '❌', label: 'Wrong', value: lastResult.wrong_words.length, color: 'from-red-300 to-pink-400' }
              ].map((stat, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-white border-3 border-white shadow-lg`}>
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <p className="text-xs font-black uppercase opacity-90">{stat.label}</p>
                  <p className="text-3xl font-black drop-shadow">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {lastResult.passed ? (
                <button 
                  onClick={nextLevel} 
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-600 hover:from-purple-600 hover:via-pink-600 hover:to-red-700 text-white font-bold py-3 rounded-2xl transition-all transform hover:scale-105 text-base border-2 border-purple-300 active:scale-95"
                >
                  <span>{levelNumber < TOTAL_LEVELS ? '→' : '✓'}</span>
                  <span>{levelNumber < TOTAL_LEVELS ? 'Next Level' : 'Back to Levels'}</span>
                </button>
              ) : (
                <button 
                  onClick={retryLevel} 
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500 hover:from-orange-500 hover:via-yellow-600 hover:to-red-600 text-white font-bold py-3 rounded-2xl transition-all transform hover:scale-105 text-base border-2 border-orange-300 active:scale-95"
                >
                  <span>↻</span>
                  <span>Try Again</span>
                </button>
              )}

              <button
                onClick={() => navigate('/game')}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-slate-700 font-bold py-3 rounded-2xl transition-all transform hover:scale-105 text-base border-2 border-blue-300 active:scale-95"
              >
                <span>📋</span>
                <span>Level List</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-gradient-to-r from-red-300 to-pink-300 border-2 border-red-500 text-red-800 px-6 py-4 text-center font-bold text-lg shadow-lg animate-shake flex items-center justify-center gap-2">
            <FaTimes className="text-2xl" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <style>{`
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
