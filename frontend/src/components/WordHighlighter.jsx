/**
 * WordHighlighter.jsx
 * -------------------
 * Renders each word of the original text with a green (correct) or
 * red/underline (wrong) highlight based on the comparison result.
 *
 * Props:
 *   wordComparison – array of { word: string, status: "correct" | "wrong" }
 *   dir            – text direction, e.g. "ltr" or "rtl"
 */
export default function WordHighlighter({ wordComparison = [], dir = 'ltr' }) {
  if (!wordComparison.length) return null

  return (
    <div dir={dir} className="flex flex-wrap gap-2 leading-relaxed">
      {wordComparison.map((item, idx) => (
        <span
          key={idx}
          className={`px-2 py-0.5 rounded text-sm font-medium
            ${item.status === 'correct'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-700 underline decoration-wavy decoration-red-400'
            }`}
        >
          {item.word}
        </span>
      ))}
    </div>
  )
}
