/**
 * constants.js
 * ------------
 * Shared configuration used across the frontend.
 */

/** Base URL of the FastAPI backend */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/** Supported languages with their BCP-47 codes and display labels */
export const LANGUAGES = [
  { code: 'en-US', label: 'English', dir: 'ltr', recognitionCode: 'en-US' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)', dir: 'ltr', recognitionCode: 'hi-IN' },
  { code: 'mr-IN', label: 'Marathi (मराठी)', dir: 'ltr', recognitionCode: 'mr-IN' },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)', dir: 'ltr', recognitionCode: 'gu-IN' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)', dir: 'ltr', recognitionCode: 'bn-IN' },
  { code: 'ar-SA', label: 'Arabic (العربية)', dir: 'rtl', recognitionCode: 'ar-SA' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)', dir: 'ltr', recognitionCode: 'te-IN' },
  { code: 'or-IN', label: 'Odia (ଓଡ଼ିଆ)', dir: 'ltr', recognitionCode: 'or-IN' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)', dir: 'ltr', recognitionCode: 'ta-IN' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)', dir: 'ltr', recognitionCode: 'pa-IN' },
  { code: 'sa-IN', label: 'Sanskrit (संस्कृत)', dir: 'ltr', recognitionCode: 'hi-IN' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)', dir: 'ltr', recognitionCode: 'ml-IN' },
]

export const LANGUAGE_META = Object.fromEntries(
  LANGUAGES.map((language) => [language.code, language])
)

export function isRtlLanguage(code) {
  return LANGUAGE_META[code]?.dir === 'rtl'
}

export function getRecognitionLanguage(code) {
  return LANGUAGE_META[code]?.recognitionCode || code
}

/** Practice text length options */
export const TEXT_LENGTHS = [
  { value: 'short',  label: 'Short  (40–60 words)' },
  { value: 'medium', label: 'Medium (80–120 words)' },
  { value: 'long',   label: 'Long   (150+ words)' },
]

/** Difficulty levels */
export const LEVELS = [
  {
    value: 'easy',
    label: 'Easy',
    emoji: '🟢',
    desc: 'Simple words, short sentences',
  },
  {
    value: 'medium',
    label: 'Medium',
    emoji: '🟡',
    desc: 'Moderate vocabulary',
  },
  {
    value: 'hard',
    label: 'Hard',
    emoji: '🔴',
    desc: 'Complex words, tongue twisters',
  },
]
