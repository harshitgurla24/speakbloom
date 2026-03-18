/**
 * Loader.jsx
 * ----------
 * Simple animated spinner shown while API calls are in-flight.
 */
export default function Loader({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative w-20 h-20">
        {/* Rainbow spinner */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-400 border-r-yellow-400 border-b-green-400 border-l-blue-400 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 border-r-pink-400 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        {/* Center emoji */}
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          ✨
        </div>
      </div>
      <p className="text-white font-black text-lg drop-shadow-lg text-center">{message}</p>
    </div>
  )
}
