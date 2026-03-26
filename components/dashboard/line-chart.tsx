'use client'

interface LineChartProps {
  labels: string[]
  values: number[]
  color?: string
  height?: number
  formatValue?: (v: number) => string
}

export function LineChart({
  labels,
  values,
  color = '#2563eb',
  height = 200,
  formatValue = (v) => String(v),
}: LineChartProps) {
  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data yet
      </div>
    )
  }

  const padding = { top: 20, right: 16, bottom: 40, left: 48 }
  const chartWidth = 100 // percent-based, SVG viewBox handles scaling
  const chartHeight = height

  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const yMin = minVal - range * 0.1
  const yMax = maxVal + range * 0.1
  const yRange = yMax - yMin || 1

  const innerW = 600 - padding.left - padding.right
  const innerH = chartHeight - padding.top - padding.bottom

  const points = values.map((v, i) => ({
    x: padding.left + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: padding.top + innerH - ((v - yMin) / yRange) * innerH,
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Gridlines (4 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + (yRange * i) / 4
    const y = padding.top + innerH - (i / 4) * innerH
    return { y, label: formatValue(Math.round(val * 10) / 10) }
  })

  return (
    <svg
      viewBox={`0 0 600 ${chartHeight}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Line chart"
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

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Area fill */}
      <polygon
        points={`${points[0].x},${padding.top + innerH} ${polyline} ${points[points.length - 1].x},${padding.top + innerH}`}
        fill={color}
        fillOpacity={0.08}
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = padding.left + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW)
        // Show every label if <=6, otherwise show every other
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
