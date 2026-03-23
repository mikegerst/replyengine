const statusConfig = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
  draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-blue-100 text-blue-800' },
  posted: { label: 'Posted', className: 'bg-green-100 text-green-800' },
  skipped: { label: 'Skipped', className: 'bg-red-100 text-red-700' },
} as const

interface StatusBadgeProps {
  status: keyof typeof statusConfig
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
