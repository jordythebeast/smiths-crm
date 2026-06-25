import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import type { Job, JobStatus } from '@/lib/types'

const STATUS_ORDER: JobStatus[] = ['checked_in', 'in_progress', 'ready', 'checked_out']
const SERVICE_LABELS: Record<JobStatus, string> = {
  checked_in: 'Checked In',
  in_progress: 'In Progress',
  ready: 'Ready for Pickup',
  checked_out: 'Completed',
}
const BUY_SELL_LABELS: Record<JobStatus, string> = {
  checked_in: 'In Stock',
  in_progress: 'Being Prepped',
  ready: 'For Sale',
  checked_out: 'Sold',
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status: filterStatus, type: viewType } = await searchParams
  const isBuySell = viewType === 'buy_sell'
  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select('*, bike:bikes(*), customer:customers(*), tasks(*)')
    .eq('job_type', isBuySell ? 'buy_sell' : 'service')
    .order('created_at', { ascending: false })

  if (filterStatus) {
    query = query.eq('status', filterStatus)
  }

  const { data: jobs } = await query

  const labels = isBuySell ? BUY_SELL_LABELS : SERVICE_LABELS

  const grouped = STATUS_ORDER.reduce<Record<JobStatus, Job[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<JobStatus, Job[]>
  )
  for (const job of jobs || []) {
    if (grouped[job.status as JobStatus]) {
      grouped[job.status as JobStatus].push(job as Job)
    }
  }

  const activeStatuses: JobStatus[] = filterStatus
    ? [filterStatus as JobStatus]
    : ['checked_in', 'in_progress', 'ready']

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Workshop</h1>
      </div>

      {/* View toggle: Service vs Buy & Sell */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-0 overflow-x-auto">
        <Link
          href="/jobs"
          className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            !isBuySell ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Service &amp; Repair
        </Link>
        <Link
          href="/jobs?type=buy_sell"
          className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            isBuySell ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Buy &amp; Sell
        </Link>

        <div className="flex-1" />

        {/* Status sub-filter */}
        {[undefined, ...STATUS_ORDER].map((s) => (
          <Link
            key={s ?? 'all'}
            href={s ? `/jobs?${isBuySell ? 'type=buy_sell&' : ''}status=${s}` : `/jobs${isBuySell ? '?type=buy_sell' : ''}`}
            className={`shrink-0 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              filterStatus === s || (!filterStatus && !s)
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            {s ? labels[s] : 'Active'}
          </Link>
        ))}
      </div>

      <div className="page-content space-y-6">
        {activeStatuses.map((status) => {
          const statusJobs = grouped[status]
          if (!statusJobs.length && !filterStatus) return null

          return (
            <div key={status}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {labels[status]}
                <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
                  ({statusJobs.length})
                </span>
              </h2>
              {statusJobs.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">None</p>
              ) : (
                <div className="space-y-2">
                  {statusJobs.map((job: Job) => (
                    <JobCard key={job.id} job={job} labels={labels} />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filterStatus === 'checked_out' && (
          <div className="space-y-2">
            {grouped['checked_out'].map((job: Job) => (
              <JobCard key={job.id} job={job} labels={labels} />
            ))}
          </div>
        )}

        {!jobs?.length && (
          <div className="card p-8 text-center">
            <p className="text-gray-500 font-medium">
              {isBuySell ? 'No buy & sell bikes yet' : 'No active jobs'}
            </p>
            <Link href="/jobs/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              {isBuySell ? 'Add a Buy & Sell Bike' : 'Check In a Bike'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function jobAge(checkInDate: string): { text: string; className: string } {
  const days = Math.floor((Date.now() - new Date(checkInDate).getTime()) / 86400000)
  const text =
    days === 0 ? 'Today' :
    days === 1 ? '1 day' :
    days < 7 ? `${days}d` :
    days < 30 ? `${Math.floor(days / 7)}w` :
    `${Math.floor(days / 30)}mo`
  const className =
    days < 3 ? 'text-gray-400' :
    days < 7 ? 'text-amber-500 font-semibold' :
    'text-red-500 font-semibold'
  return { text, className }
}

function JobCard({ job, labels }: { job: Job; labels: Record<JobStatus, string> }) {
  const openTasks = (job.tasks || []).filter((t) => !t.completed)
  const overdueTasks = openTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date())
  const age = job.status !== 'checked_out' ? jobAge(job.check_in_date) : null

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card p-4 flex items-start gap-3 hover:shadow-sm transition-shadow block"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded tracking-wide">
            #{job.job_number}
          </span>
          <span className="font-semibold text-sm">{job.customer?.name || 'No customer'}</span>
          <StatusBadge status={job.status} />
          {overdueTasks.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
              {overdueTasks.length} overdue
            </span>
          )}
          {openTasks.length > 0 && overdueTasks.length === 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {openTasks.length} task{openTasks.length > 1 ? 's' : ''}
            </span>
          )}
          {age && (
            <span className={`text-xs ml-auto ${age.className}`}>{age.text}</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {job.bike ? `${job.bike.year || ''} ${job.bike.make} ${job.bike.model}` : '—'}
          {job.bike?.registration && (
            <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
              {job.bike.registration}
            </span>
          )}
        </p>
        {job.customer_description && (
          <p className="text-xs text-gray-400 truncate mt-1">{job.customer_description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          In:{' '}
          {new Date(job.check_in_date).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
          })}
          {job.estimated_cost && (
            <span className="ml-3">Est. R{Number(job.estimated_cost).toFixed(0)}</span>
          )}
        </p>
      </div>
    </Link>
  )
}
