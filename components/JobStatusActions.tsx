'use client'

import { updateJobStatus } from '@/app/actions/jobs'
import type { JobStatus } from '@/lib/types'
import { useTransition } from 'react'

const SERVICE_NEXT: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  checked_in: { status: 'in_progress', label: 'Start Work' },
  in_progress: { status: 'ready', label: 'Mark Ready for Pickup' },
  ready: { status: 'checked_out', label: 'Check Out (Collected)' },
}
const BUY_SELL_NEXT: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  checked_in: { status: 'in_progress', label: 'Start Prepping' },
  in_progress: { status: 'ready', label: 'Mark For Sale' },
  ready: { status: 'checked_out', label: 'Mark as Sold' },
}
const SERVICE_PREV: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  in_progress: { status: 'checked_in', label: 'Back to Checked In' },
  ready: { status: 'in_progress', label: 'Back to In Progress' },
}
const BUY_SELL_PREV: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  in_progress: { status: 'checked_in', label: 'Back to In Stock' },
  ready: { status: 'in_progress', label: 'Back to Being Prepped' },
}

export default function JobStatusActions({
  jobId,
  currentStatus,
  jobType = 'service',
}: {
  jobId: string
  currentStatus: JobStatus
  jobType?: 'service' | 'buy_sell'
}) {
  const [isPending, startTransition] = useTransition()
  const isBuySell = jobType === 'buy_sell'
  const next = (isBuySell ? BUY_SELL_NEXT : SERVICE_NEXT)[currentStatus]
  const prev = (isBuySell ? BUY_SELL_PREV : SERVICE_PREV)[currentStatus]

  if (!next && currentStatus === 'checked_out') return null

  return (
    <div className="flex gap-2">
      {prev && (
        <button
          onClick={() => startTransition(() => updateJobStatus(jobId, prev.status))}
          disabled={isPending}
          className="btn-ghost text-sm py-2"
        >
          {prev.label}
        </button>
      )}
      {next && (
        <button
          onClick={() => startTransition(() => updateJobStatus(jobId, next.status))}
          disabled={isPending}
          className="btn-primary flex-1 py-3 text-sm"
        >
          {isPending ? 'Updating...' : next.label}
        </button>
      )}
    </div>
  )
}
