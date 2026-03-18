/**
 * StatCard.jsx
 * ------------
 * A small card that displays a labelled metric value.
 *
 * Props:
 *   icon    – emoji or icon string
 *   label   – string
 *   value   – string | number
 *   color   – Tailwind colour token prefix, e.g. "blue", "green", "amber"
 */
export default function StatCard({ icon, label, value, color = 'blue' }) {
  const colorMap = {
    blue:   'bg-blue-50  text-blue-700  border-blue-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-red-50   text-red-700   border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  const cls = colorMap[color] || colorMap.blue

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border p-5 ${cls}`}>
      <span className="text-3xl mb-1">{icon}</span>
      <span className="text-2xl font-extrabold">{value}</span>
      <span className="text-xs font-medium mt-0.5 opacity-75">{label}</span>
    </div>
  )
}
