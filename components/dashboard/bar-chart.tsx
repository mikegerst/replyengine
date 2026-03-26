'use client'

interface BarChartProps {
  labels: string[]
  values: number[]
  color?: string
  height?: number
}

export function BarChart({
  labels,
  values,
  color = '#2563eb',
  height = 200,
}: BarChartProps) {
  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data yet
      </div>
    )
  }

  const padding = { top: 20, right: 16, bottom: 40, left: 48 }
  const chartHeight = height
  const maxVal = Math.max(...values, 1)

  const innerW = 600 - padding.left - padding.right
  const innerH = chartHeight - padding.top - padding.bottom

  const barWidth = Math.min(40, (innerW / values.length) * 0.6)
  const gap = (innerW - barWidth * values.length) / (values.length + 1)

  // Gridlines (4 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = (maxVal * i) / 4
    const y = padding.top + innerH - (i / 4) * innerH
    return { y, label: String(Math.round(val)) }
  })

  return (
    <svg
      viewBox={`0 0 600 ${chartHeight}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bar chart"
    >
      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={600 - padding.right}
            y2={line.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <text
            x={padding.left - 8}
            y={line.y + 4}
            textAnchor="end"
            className="text-[11px]"
            fill="#9ca3af"
          >
            {line.label}
          </text>
        </g>
      ))}

      {/* Bars */}
      {values.map((v, i) => {
        const barH = (v / maxVal) * innerH
        const x = padding.left + gap + i * (barWidth + gap)
        const y = padding.top + innerH - barH

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={color}
              rx={2}
              fillOpacity={0.85}
            />
            {/* Value on top of bar */}
            {v > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="text-[10px]"
                fill="#6b7280"
              >
                {v}
              </text>
            )}
          </g>
        )
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = padding.left + gap + i * (barWidth + gap) + barWidth / 2
        if (labels.length > 6 && i % 2 !== 0 && i !== labels.length - 1) return null
        return (
          <text
            key={i}
            x={x}
            y={chartHeight - 8}
            textAnchor="middle"
            className="text-[10px]"
            fill="#9ca3af"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}
