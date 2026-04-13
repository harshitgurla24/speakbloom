import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import PracticePage from './pages/PracticePage'
import ResultPage from './pages/ResultPage'
import GamePage from './pages/GamePage'
import GameLevelPage from './pages/GameLevelPage'
import AdminPanel from './pages/AdminPanel'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

/**
 * App.jsx – Root component.
 * Provides client-side routing via React Router v6.
 *
 * Route structure:
 *   /              → HomePage   (language + length selection)
 *   /practice      → PracticePage (recording & speech recognition)
 *   /result        → ResultPage  (accuracy dashboard)
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans">
        <Navbar />
        <main className="pt-6 pb-16">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
            <Route path="/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
            <Route path="/game/level/:levelNumber" element={<ProtectedRoute><GameLevelPage /></ProtectedRoute>} />
            <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
