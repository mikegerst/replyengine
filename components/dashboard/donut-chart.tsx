'use client'

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
}

export function DonutChart({ segments, size = 180 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height: size }}>
        No data yet
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.6

  let cumulativeAngle = -90 // start at top

  const paths = segments
    .filter((seg) => seg.value > 0)
    .map((seg) => {
      const angle = (seg.value / total) * 360
      const startAngle = cumulativeAngle
      const endAngle = cumulativeAngle + angle
      cumulativeAngle = endAngle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1Outer = cx + outerR * Math.cos(startRad)
      const y1Outer = cy + outerR * Math.sin(startRad)
      const x2Outer = cx + outerR * Math.cos(endRad)
      const y2Outer = cy + outerR * Math.sin(endRad)

      const x1Inner = cx + innerR * Math.cos(endRad)
      const y1Inner = cy + innerR * Math.sin(endRad)
      const x2Inner = cx + innerR * Math.cos(startRad)
      const y2Inner = cy + innerR * Math.sin(startRad)

      const largeArc = angle > 180 ? 1 : 0

      const d = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
        'Z',
      ].join(' ')

      return { d, color: seg.color, label: seg.label, value: seg.value }
    })

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Donut chart"
      >
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-[22px] font-semibold" fill="#111827">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-[11px]" fill="#9ca3af">
          reviews
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.filter((s) => s.value > 0).map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-gray-600">
              {seg.label} ({seg.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
