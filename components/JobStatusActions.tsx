'use client'

import { updateJobStatus } from '@/app/actions/jobs'
import type { JobStatus } from '@/lib/types'
import { useTransition } from 'react'

const NEXT_STATUS: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  checked_in: { status: 'in_progress', label: 'Start Work' },
  in_progress: { status: 'ready', label: 'Mark Ready for Pickup' },
  ready: { status: 'checked_out', label: 'Check Out (Collected)' },
}

const PREV_STATUS: Partial<Record<JobStatus, { status: JobStatus; label: string }>> = {
  in_progress: { status: 'checked_in', label: 'Back to Checked In' },
  ready: { status: 'in_progress', label: 'Back to In Progress' },
}

export default function JobStatusActions({
  jobId,
  currentStatus,
}: {
  jobId: string
  currentStatus: JobStatus
}) {
  const [isPending, startTransition] = useTransition()
  const next = NEXT_STATUS[currentStatus]
  const prev = PREV_STATUS[currentStatus]

  if (!next && currentStatus === 'checked_out') {
    return null
  }

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
