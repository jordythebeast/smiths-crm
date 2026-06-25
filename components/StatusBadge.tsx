import clsx from 'clsx'
import type { JobStatus } from '@/lib/types'

const config: Record<JobStatus, { label: string; className: string }> = {
  checked_in: {
    label: 'Checked In',
    className: 'bg-blue-100 text-blue-800',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-800',
  },
  ready: {
    label: 'Ready for Pickup',
    className: 'bg-green-100 text-green-800',
  },
  checked_out: {
    label: 'Completed',
    className: 'bg-gray-100 text-gray-600',
  },
}

export default function StatusBadge({ status }: { status: JobStatus }) {
  const { label, className } = config[status]
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', className)}>
      {label}
    </span>
  )
}
