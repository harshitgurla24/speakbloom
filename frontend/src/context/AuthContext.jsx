import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import apiClient, { ACCESS_TOKEN_KEY } from '../apiClient'

const USER_KEY = 'speakbloom_user'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const loginWithGoogleCredential = useCallback(async (credential) => {
    if (!credential) {
      setAuthError('Google sign-in credential was not received.')
      return
    }

    try {
      setAuthError('')
      const { data } = await apiClient.post('/auth/google', { credential })
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
    } catch (error) {
      clearSession()
      setAuthError(
        error.response?.data?.detail ||
        'Google sign-in failed. Please check your configuration and try again.'
      )
    }
  }, [clearSession])

  const logout = useCallback(() => {
    clearSession()
    setAuthError('')
  }, [clearSession])

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setIsAuthLoading(false)
        return
      }

      try {
        const { data } = await apiClient.get('/auth/me')
        setUser(data)
        localStorage.setItem(USER_KEY, JSON.stringify(data))
      } catch {
        clearSession()
      } finally {
        setIsAuthLoading(false)
      }
    }

    bootstrapAuth()
  }, [clearSession])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isAuthLoading,
    authError,
    setAuthError,
    loginWithGoogleCredential,
    logout,
    hasGoogleClientId: Boolean(GOOGLE_CLIENT_ID),
    googleClientId: GOOGLE_CLIENT_ID,
  }), [
    user,
    isAuthLoading,
    authError,
    loginWithGoogleCredential,
    logout,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
