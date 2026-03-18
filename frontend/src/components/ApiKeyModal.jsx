import { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { apiKeyMethods } from '../apiClient'

export default function ApiKeyModal({ isOpen, onClose, onSuccess }) {
  const [apiKey, setApiKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  if (!isOpen) return null

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ text: 'Please enter an API key', type: 'error' })
      return
    }

    setIsSaving(true)
    setMessage({ text: '', type: '' })

    try {
      // Trim whitespace before saving
      await apiKeyMethods.saveApiKey(apiKey.trim())
      setMessage({ text: '✅ API key saved successfully!', type: 'success' })
      setApiKey('')
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
        // Reload page to reflect API key changes
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({ text: '❌ Failed to save API key. Please check if the key is correct.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-4 border-blue-200 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔑</span>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Add Groq API Key
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-blue-900 mb-2">📍 Step-by-step Guide:</p>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline hover:text-blue-700">Groq API Keys Page</a></li>
            <li>Sign up/Login with your account</li>
            <li>Create API key in the "Keys" section</li>
            <li>Copy the full API key (starts with "gsk_")</li>
            <li>Paste it below and click Add</li>
          </ol>
        </div>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Paste your Groq API Key:
          </label>
          <textarea
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_your_api_key_here..."
            className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="3"
          />
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-semibold ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border-2 border-green-300' 
              : 'bg-red-100 text-red-800 border-2 border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleSaveApiKey}
          disabled={isSaving || !apiKey.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold py-3 px-4 rounded-lg transition-all"
        >
          {isSaving ? '⏳ Adding Key...' : '✅ Add API Key'}
        </button>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 font-semibold mt-4 text-center">
          🛡️ Your API key is encrypted and stored securely
        </p>
      </div>
    </div>
  )
}
