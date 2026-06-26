import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import SearchInput from '@/components/SearchInput'
import AccountingView from '@/components/AccountingView'
import type { AccountingJob } from '@/components/AccountingView'
import AccountingPeriodFilter from '@/components/AccountingPeriodFilter'
import { Suspense } from 'react'
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

function getPeriodCutoff(period: string): { from: string; to?: string } | null {
  const now = new Date()
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: from.toISOString() }
  }
  if (period === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: from.toISOString(), to: to.toISOString() }
  }
  if (period === 'year') {
    const from = new Date(now.getFullYear(), 0, 1)
    return { from: from.toISOString() }
  }
  return null
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string; period?: string; from?: string; to?: string }>
}) {
  const { status: filterStatus, type: viewType, q, period, from: fromParam, to: toParam } = await searchParams
  const isBuySell = viewType === 'buy_sell'
  const isAccounting = viewType === 'accounting'
  const supabase = await createClient()

  // --- Accounting view ---
  if (isAccounting) {
    const activePeriod = period ?? 'month'
    const cutoff = activePeriod === 'custom' ? null : getPeriodCutoff(activePeriod)

    let acctQuery = supabase
      .from('jobs')
      .select('id, job_number, job_type, check_in_date, check_out_date, customer_description, work_performed, parts_cost, labour_cost, tax_rate, final_cost, estimated_cost, customer:customers(name), bike:bikes(make, model, year, registration)')
      .eq('status', 'checked_out')
      .order('check_out_date', { ascending: false })

    if (activePeriod === 'custom' && fromParam && toParam) {
      // toParam is a date (YYYY-MM-DD) — add one day so "to" is inclusive
      const toInclusive = new Date(toParam)
      toInclusive.setDate(toInclusive.getDate() + 1)
      acctQuery = acctQuery
        .gte('check_out_date', new Date(fromParam).toISOString())
        .lt('check_out_date', toInclusive.toISOString())
    } else if (cutoff) {
      acctQuery = acctQuery.gte('check_out_date', cutoff.from)
      if (cutoff.to) acctQuery = acctQuery.lt('check_out_date', cutoff.to)
    }

    const { data: acctJobs } = await acctQuery

    return (
      <div>
        <div className="page-header">
          <h1 className="text-xl font-bold">Workshop</h1>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-0 overflow-x-auto">
          <Link href="/jobs" className="shrink-0 py-3 px-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-black">
            Service &amp; Repair
          </Link>
          <Link href="/jobs?type=buy_sell" className="shrink-0 py-3 px-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-black">
            Buy &amp; Sell
          </Link>
          <Link href="/jobs?type=accounting" className="shrink-0 py-3 px-4 text-sm font-medium border-b-2 border-red-600 text-red-600">
            Accounting
          </Link>
        </div>

        <div className="page-content space-y-4">
          <AccountingPeriodFilter
            activePeriod={activePeriod}
            activeFrom={fromParam}
            activeTo={toParam}
          />

          <AccountingView jobs={(acctJobs ?? []) as unknown as AccountingJob[]} period={activePeriod} />
        </div>
      </div>
    )
  }

  // --- Workshop view (Service & Buy & Sell) ---
  let query = supabase
    .from('jobs')
    .select('*, bike:bikes(*), customer:customers(*), tasks(*)')
    .eq('job_type', isBuySell ? 'buy_sell' : 'service')
    .order('created_at', { ascending: false })

  if (filterStatus) {
    query = query.eq('status', filterStatus)
  }

  if (filterStatus === 'checked_out' && period && period !== 'all') {
    const cutoff = new Date()
    if (period === 'week') cutoff.setDate(cutoff.getDate() - 7)
    else if (period === 'month') cutoff.setDate(cutoff.getDate() - 30)
    query = query.gte('check_out_date', cutoff.toISOString())
  }

  const { data: rawJobs } = await query

  const searchQ = (q ?? '').toLowerCase().trim()
  const jobs = searchQ
    ? (rawJobs || []).filter(
        (j) =>
          j.customer?.name?.toLowerCase().includes(searchQ) ||
          String(j.job_number).includes(searchQ) ||
          j.bike?.make?.toLowerCase().includes(searchQ) ||
          j.bike?.model?.toLowerCase().includes(searchQ)
      )
    : rawJobs || []

  const labels = isBuySell ? BUY_SELL_LABELS : SERVICE_LABELS

  const grouped = STATUS_ORDER.reduce<Record<JobStatus, Job[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<JobStatus, Job[]>
  )
  for (const job of jobs) {
    if (grouped[job.status as JobStatus]) {
      grouped[job.status as JobStatus].push(job as Job)
    }
  }

  const activeStatuses: JobStatus[] = filterStatus
    ? [filterStatus as JobStatus]
    : ['checked_in', 'in_progress', 'ready']

  const floorValue = isBuySell && !filterStatus
    ? jobs.filter((j) => j.status !== 'checked_out').reduce((sum, j) => sum + Number(j.estimated_cost || 0), 0)
    : 0

  const typeBase = isBuySell ? '?type=buy_sell' : ''

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Workshop</h1>
      </div>

      {/* Tab bar */}
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
        <Link
          href="/jobs?type=accounting"
          className="shrink-0 py-3 px-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-black"
        >
          Accounting
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

      {/* Search bar */}
      <div className="px-4 pt-3 pb-1">
        <Suspense>
          <SearchInput placeholder="Search by customer, job number or bike..." />
        </Suspense>
      </div>

      <div className="page-content space-y-6">
        {isBuySell && !filterStatus && floorValue > 0 && (
          <div className="card p-4 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">Floor value (active stock)</span>
            <span className="text-lg font-bold">R {floorValue.toFixed(0)}</span>
          </div>
        )}

        {filterStatus === 'checked_out' && (
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((p) => {
              const label = p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'All time'
              const href = `/jobs${typeBase ? typeBase + '&' : '?'}status=checked_out${p !== 'all' ? '&period=' + p : ''}`
              const active = (p === 'all' && !period) || period === p
              return (
                <Link
                  key={p}
                  href={href}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    active ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}

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
                  {statusJobs.map((job: Job) => <JobCard key={job.id} job={job} labels={labels} />)}
                </div>
              )}
            </div>
          )
        })}

        {filterStatus === 'checked_out' && (
          <div className="space-y-2">
            {grouped['checked_out'].map((job: Job) => <JobCard key={job.id} job={job} labels={labels} />)}
          </div>
        )}

        {!jobs?.length && (
          <div className="card p-8 text-center">
            <p className="text-gray-500 font-medium">
              {searchQ ? 'No results found' : isBuySell ? 'No buy & sell bikes yet' : 'No active jobs'}
            </p>
            {!searchQ && (
              <Link href="/jobs/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                {isBuySell ? 'Add a Buy & Sell Bike' : 'Check In a Bike'}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function jobAge(checkInDate: string): { text: string; className: string } {
  const days = Math.floor((Date.now() - new Date(checkInDate).getTime()) / 86400000)
  const text =
    days === 0 ? 'Today' : days === 1 ? '1 day' : days < 7 ? `${days}d` :
    days < 30 ? `${Math.floor(days / 7)}w` : `${Math.floor(days / 30)}mo`
  const className =
    days < 3 ? 'text-gray-400' : days < 7 ? 'text-amber-500 font-semibold' : 'text-red-500 font-semibold'
  return { text, className }
}

function JobCard({ job, labels }: { job: Job; labels: Record<JobStatus, string> }) {
  const openTasks = (job.tasks || []).filter((t) => !t.completed)
  const overdueTasks = openTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date())
  const age = job.status !== 'checked_out' ? jobAge(job.check_in_date) : null

  return (
    <Link href={`/jobs/${job.id}`} className="card p-4 flex items-start gap-3 hover:shadow-sm transition-shadow block">
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
          {age && <span className={`text-xs ml-auto ${age.className}`}>{age.text}</span>}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {job.bike ? `${job.bike.year || ''} ${job.bike.make} ${job.bike.model}` : '—'}
          {job.bike?.registration && (
            <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{job.bike.registration}</span>
          )}
        </p>
        {job.customer_description && (
          <p className="text-xs text-gray-400 truncate mt-1">{job.customer_description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          In: {new Date(job.check_in_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
          {job.estimated_cost && <span className="ml-3">Est. R{Number(job.estimated_cost).toFixed(0)}</span>}
        </p>
      </div>
    </Link>
  )
}
