import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRecognitionLanguage, isRtlLanguage } from '../constants'
import apiClient from '../apiClient'
import { FaMicrophone, FaCheck, FaTimes } from 'react-icons/fa'

// ---------------------------------------------------------------------------
// Helper – normalize a word for comparison (lowercase, strip punctuation)
// ---------------------------------------------------------------------------
function normalizeWord(w) {
  return w
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, '')
}

// ---------------------------------------------------------------------------
// Component – renders the practice paragraph with real-time green/red colors
//
// Each word gets a status:
//   'correct'  → green  (user said it right)
//   'wrong'    → red    (user said something different at this position)
//   'current'  → underline pulse  (next word to be spoken)
//   'pending'  → slate  (not yet reached)
// ---------------------------------------------------------------------------
function LiveTextHighlighter({ originalText, spokenWords, active }) {
  // Split original text preserving spacing tokens so we can rejoin naturally
  const tokens = useMemo(() => {
    // Split into [word, space/punct]* chunks
    const result = []
    const regex = /(\S+)(\s*)/g
    let m
    while ((m = regex.exec(originalText)) !== null) {
      result.push({ word: m[1], space: m[2] })
    }
    return result
  }, [originalText])

  const normalizedSpoken = useMemo(
    () => spokenWords.map(normalizeWord).filter(Boolean),
    [spokenWords]
  )

  const statuses = useMemo(() => {
    const normalizedOriginal = tokens.map((t) => normalizeWord(t.word))
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

    const currentIndex = result.findIndex((s) => s === 'pending')
    if (active && currentIndex >= 0) {
      result[currentIndex] = 'current'
    }

    return result
  }, [tokens, normalizedSpoken, active])

  return (
    <p className="text-lg leading-relaxed tracking-wide">
      {tokens.map(({ word, space }, idx) => {
        const status = statuses[idx]

        const cls = {
          correct: 'text-green-600 font-semibold',
          wrong:   'text-red-500   font-semibold underline decoration-wavy decoration-red-400',
          current: 'text-blue-600  font-semibold underline decoration-2 underline-offset-4 animate-pulse',
          pending: 'text-slate-700',
        }[status]

        return (
          <span key={idx}>
            <span className={`transition-colors duration-200 ${cls}`}>{word}</span>
            {space}
          </span>
        )
      })}
    </p>
  )
}

/**
 * PracticePage
 * ------------
 * Renders the generated practice paragraph and allows the user to:
 *   1. Start/stop browser-based speech recognition (Web Speech API)
 *   2. See a live transcript as they speak
 *   3. Submit the recording for analysis → navigates to ResultPage
 *
 * State stored in sessionStorage (set by HomePage):
 *   practiceText  – the paragraph to read
 *   language      – BCP-47 language code for speech recognition
 */
export default function PracticePage() {
  const navigate = useNavigate()

  // Retrieve text & language saved by HomePage
  const practiceText = sessionStorage.getItem('practiceText') || ''
  const language     = sessionStorage.getItem('language')     || 'en-US'
  const level        = sessionStorage.getItem('level')        || 'easy'
  const textDirection = isRtlLanguage(language) ? 'rtl' : 'ltr'
  const recognitionLanguage = getRecognitionLanguage(language)

  const levelConfig = {
    easy:   { emoji: '🟢', label: 'Easy',   color: 'text-green-600 bg-green-50 border-green-200' },
    medium: { emoji: '🟡', label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    hard:   { emoji: '🔴', label: 'Hard',   color: 'text-red-600 bg-red-50 border-red-200' },
  }
  const lvl = levelConfig[level] || levelConfig.easy

  const [isRecording, setIsRecording]     = useState(false)
  const [transcript,  setTranscript]      = useState('')
  const [interimText, setInterimText]     = useState('')
  const [error,       setError]           = useState('')
  const [submitting,  setSubmitting]      = useState(false)

  // Combined spoken words array (final + current interim) for live highlighting
  const spokenWords = useMemo(() => {
    const combined = (transcript + ' ' + interimText).trim()
    return combined ? combined.split(/\s+/).filter(Boolean) : []
  }, [transcript, interimText])

  // Refs to keep mutable state accessible inside event handlers
  const recognitionRef = useRef(null)
  const startTimeRef   = useRef(null)
  const finalRef       = useRef('')   // accumulates final results
  const shouldRestartRef = useRef(false)

  // Redirect home if no text was generated
  useEffect(() => {
    if (!practiceText) navigate('/')
  }, [practiceText, navigate])

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  // -------------------------------------------------------------------
  // Speech recognition helpers
  // -------------------------------------------------------------------

  /**
   * Initialise the Web Speech API recognition object.
   * Falls back to a warning if the browser does not support it.
   */
  const buildRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Your browser does not support the Web Speech API. Try Chrome or Edge.')
      return null
    }

    const rec = new SpeechRecognition()
    rec.lang          = recognitionLanguage
    rec.interimResults = true   // show live partial results
    rec.continuous    = true    // don't stop at first pause
    rec.maxAlternatives = 1

    // Called for each recognition result
    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalRef.current += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(finalRef.current)
      setInterimText(interim)
    }

    rec.onerror = (e) => {
      console.error('Speech recognition error:', e.error)

      if (e.error === 'aborted' && !shouldRestartRef.current) {
        return
      }

      if (['no-speech', 'network'].includes(e.error) && shouldRestartRef.current) {
        return
      }

      setError(`Speech recognition error: ${e.error}`)
      shouldRestartRef.current = false
      setIsRecording(false)
    }

    rec.onend = () => {
      setInterimText('')

      if (shouldRestartRef.current) {
        setTimeout(() => {
          if (!shouldRestartRef.current) return
          try {
            rec.start()
          } catch {
            // Ignore rapid restart race; next end cycle will try again.
          }
        }, 120)
      }
    }

    return rec
  }

  const startRecording = () => {
    setError('')
    setTranscript('')
    setInterimText('')
    finalRef.current = ''
    shouldRestartRef.current = true

    const rec = buildRecognition()
    if (!rec) return

    recognitionRef.current = rec
    startTimeRef.current   = Date.now()
    try {
      rec.start()
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

  // -------------------------------------------------------------------
  // Submit for analysis
  // -------------------------------------------------------------------

  const handleSubmit = async () => {
    const spokenText = (transcript + ' ' + interimText).trim()
    if (!spokenText) {
      setError('No speech detected. Please record yourself reading the paragraph.')
      return
    }

    const timeTaken = startTimeRef.current
      ? (Date.now() - startTimeRef.current) / 1000
      : 1

    setSubmitting(true)
    setError('')
    try {
      const { data } = await apiClient.post('/analyze-pronunciation', {
        original_text: practiceText,
        spoken_text:   spokenText,
        time_taken:    timeTaken,
      })

      // Pass analysis result to ResultPage via sessionStorage
      sessionStorage.setItem('analysisResult', JSON.stringify(data))
      sessionStorage.setItem('spokenText', spokenText)
      navigate('/result')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Failed to analyse pronunciation. Is the backend running?'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Animated Hero Header */}
        <div className="text-center mb-10 py-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FaMicrophone className="text-3xl text-blue-600 animate-bounce" />
            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Practice Mode
            </h1>
            <FaMicrophone className="text-3xl text-indigo-600 animate-bounce" style={{animationDelay: '0.2s'}} />
          </div>
          <p className="text-sm text-slate-600 font-semibold mt-3">
            Read the text aloud and improve your pronunciation
          </p>
        </div>

        {/* Practice Text Card */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaMicrophone className="text-lg text-blue-600" />
              Read This Text
            </h2>
            <span className={`text-xs font-bold px-4 py-1 rounded-full border-2 ${lvl.color}`}>
              {lvl.label}
            </span>
          </div>

          <div dir={textDirection} className={`text-xl font-medium leading-relaxed ${textDirection === 'rtl' ? 'text-right' : 'text-left'} text-slate-900 bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl border-2 border-slate-200`}>
            <LiveTextHighlighter
              originalText={practiceText}
              spokenWords={spokenWords}
              active={isRecording || spokenWords.length > 0}
            />
          </div>

          {/* Legend */}
          {(isRecording || spokenWords.length > 0) && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-md"></span>
                <span className="text-sm font-bold text-slate-700">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-md"></span>
                <span className="text-xs font-bold text-slate-700">Wrong</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-md animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 shadow-md"></span>
                <span className="text-xs font-bold text-slate-700">Pending</span>
              </div>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-200 p-8 mb-8">
          
          {/* Record Button */}
          <div className="mb-8">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-3 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg border-2 border-red-400"
              >
                <FaMicrophone className="text-lg" />
                <span>Start Recording</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={stopRecording}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white font-bold py-3 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-base shadow-lg border-2 border-slate-500 animate-pulse"
                >
                  <span className="text-lg">⏹️</span>
                  <span>Stop Recording</span>
                </button>
                
                <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-300 to-red-400 text-white font-bold px-4 py-3 rounded-2xl border-2 border-red-500 text-center">
                  <span className="w-2 h-2 rounded-full bg-red-700 animate-pulse shadow-md"></span>
                  <span className="text-sm">Recording Live...</span>
                </div>
              </div>
            )}
          </div>

          {/* Transcript Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 p-4 mb-4 min-h-[80px]">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Your Voice (Live)</p>
            <p dir={textDirection} className={`text-base font-semibold leading-relaxed text-slate-800 min-h-[80px] ${textDirection === 'rtl' ? 'text-right' : 'text-left'}`}>
              {transcript}
              <span className="text-slate-500 italic">{interimText}</span>
              {!transcript && !interimText && (
                <span className="text-slate-400 italic">Start speaking to see your transcript here...</span>
              )}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-red-300 to-pink-300 border-2 border-red-500 text-red-800 px-6 py-4 text-center font-bold text-lg shadow-lg animate-shake flex items-center justify-center gap-2">
            <FaTimes className="text-2xl" />
            <span>{error}</span>
          </div>
        )}

        {/* Analyse Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || isRecording || (!transcript && !interimText)}
          className="w-full bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-700 hover:from-purple-600 hover:via-indigo-700 hover:to-blue-800 disabled:from-slate-300 disabled:via-slate-400 disabled:to-slate-500 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-base shadow-lg border-2 border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FaCheck className="text-lg" />
          <span>{submitting ? 'Analyzing Your Speech…' : 'Show My Score!'}</span>
        </button>

        {/* Encouragement message */}
        <div className="text-center mt-10">
          <p className="text-slate-700 font-bold text-lg">
            ✨ Keep practicing to improve your pronunciation! ✨
          </p>
        </div>
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
