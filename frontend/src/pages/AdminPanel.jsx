import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUsers, FaTrophy, FaFire, FaChartBar, FaDownload } from 'react-icons/fa'
import apiClient from '../apiClient'
import Loader from '../components/Loader'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [sortBy, setSortBy] = useState('score')

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/admin/dashboard')
        setStats(response.data)
        setUsers(response.data.users || [])
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Aapke admin access nahi hai. Admin panel access karne ke liye contact karein.')
          setTimeout(() => navigate('/home'), 3000)
        } else {
          setError('Data load karte waqt error aayi: ' + (err.response?.data?.detail || err.message))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [navigate])

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.user_name && user.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLevel = filterLevel === 'all' || user.current_level === filterLevel
    return matchesSearch && matchesLevel
  })

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.total_score - a.total_score
      case 'sessions':
        return b.total_sessions - a.total_sessions
      case 'recent':
        return new Date(b.updated_at) - new Date(a.updated_at)
      case 'joined':
        return new Date(a.created_at) - new Date(b.created_at)
      default:
        return 0
    }
  })

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Email', 'Name', 'Score', 'Level', 'Sessions', 'Languages', 'Joined', 'Last Activity']
    const rows = sortedUsers.map((user) => [
      user.user_email,
      user.user_name || 'N/A',
      user.total_score.toFixed(2),
      user.current_level,
      user.total_sessions,
      user.languages_attempted || 'None',
      formatDate(user.created_at),
      user.last_activity ? formatDate(user.last_activity) : 'Never',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <Loader message="Admin data load ho raha hai..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎓 Admin Panel</h1>
          <p className="text-purple-300">Users aur performance ke statistics yahan dekhen</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-2">Total Users</p>
                  <h2 className="text-3xl font-bold">{stats.total_users}</h2>
                </div>
                <FaUsers className="text-4xl text-blue-300 opacity-50" />
              </div>
            </div>

            {/* Active Today */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-2">Active Today</p>
                  <h2 className="text-3xl font-bold">{stats.active_users_today}</h2>
                </div>
                <FaFire className="text-4xl text-green-300 opacity-50" />
              </div>
            </div>

            {/* Active This Week */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-2">Active This Week</p>
                  <h2 className="text-3xl font-bold">{stats.active_users_week}</h2>
                </div>
                <FaChartBar className="text-4xl text-orange-300 opacity-50" />
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-2">Average Score</p>
                  <h2 className="text-3xl font-bold">{stats.average_score.toFixed(1)}</h2>
                </div>
                <FaTrophy className="text-4xl text-purple-300 opacity-50" />
              </div>
            </div>

            {/* Total Sessions */}
            <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm mb-2">Total Sessions</p>
                  <h2 className="text-3xl font-bold">{stats.total_sessions}</h2>
                </div>
                <FaChartBar className="text-4xl text-pink-300 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search User</label>
              <input
                type="text"
                placeholder="Email ya name se search karein..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Filter by Level */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">Sab Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="score">Highest Score</option>
                <option value="sessions">Most Sessions</option>
                <option value="recent">Recently Active</option>
                <option value="joined">Recently Joined</option>
              </select>
            </div>

            {/* Export Button */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">&nbsp;</label>
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
              >
                <FaDownload /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Score</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Level</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Sessions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Languages</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user, idx) => (
                    <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 text-sm text-slate-200">{user.user_email}</td>
                      <td className="px-6 py-4 text-sm text-slate-200">{user.user_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full font-medium">
                          {user.total_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span
                          className={`px-3 py-1 rounded-full font-medium text-sm ${
                            user.current_level === 'advanced'
                              ? 'bg-green-600/30 text-green-300'
                              : user.current_level === 'intermediate'
                                ? 'bg-blue-600/30 text-blue-300'
                                : 'bg-orange-600/30 text-orange-300'
                          }`}
                        >
                          {user.current_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-300">{user.total_sessions}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{user.languages_attempted || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {user.last_activity ? formatDate(user.last_activity) : 'Never'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                      Koi users nahi milae filters ke according
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          Total {sortedUsers.length} users show ho rahe hain
        </div>
      </div>
    </div>
  )
}
