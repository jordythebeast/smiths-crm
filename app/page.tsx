import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { Wrench, Users, CheckCircle, AlertCircle, Plus, Calendar } from 'lucide-react'
import type { Job, Task } from '@/lib/types'

type TaskWithJob = Task & { job?: { id: string; job_number: number; customer?: { name: string } } }

function dayKey(dateStr: string): string {
  return dateStr // already 'YYYY-MM-DD'
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function tomorrowKey(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function groupTasksByDay(tasks: TaskWithJob[]): Array<{ label: string; tasks: TaskWithJob[]; color: string }> {
  const today = todayKey()
  const tomorrow = tomorrowKey()

  const overdue: TaskWithJob[] = []
  const byDay: Record<string, TaskWithJob[]> = {}

  for (const t of tasks) {
    if (!t.due_date) continue
    if (t.due_date < today) {
      overdue.push(t)
    } else {
      if (!byDay[t.due_date]) byDay[t.due_date] = []
      byDay[t.due_date].push(t)
    }
  }

  const groups: Array<{ label: string; tasks: TaskWithJob[]; color: string }> = []

  if (overdue.length) {
    groups.push({ label: 'Overdue', tasks: overdue, color: 'red' })
  }

  const sortedDays = Object.keys(byDay).sort()
  for (const day of sortedDays) {
    let label: string
    if (day === today) {
      label = 'Today'
    } else if (day === tomorrow) {
      label = 'Tomorrow'
    } else {
      label = new Date(day + 'T12:00:00').toLocaleDateString('en-ZA', {
        weekday: 'long', day: 'numeric', month: 'short',
      })
    }
    const color = day === today ? 'amber' : 'blue'
    groups.push({ label, tasks: byDay[day], color })
  }

  return groups
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const endOfWeek = new Date()
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const [{ data: jobs }, { count: customerCount }, { data: upcomingTasks }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, bike:bikes(*), customer:customers(*)')
      .neq('status', 'checked_out')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase
      .from('tasks')
      .select('*, job:jobs(id, job_number, customer:customers(name))')
      .eq('completed', false)
      .not('due_date', 'is', null)
      .lte('due_date', endOfWeek.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(20),
  ])

  const activeJobs = jobs || []
  const readyForPickup = activeJobs.filter((j) => j.status === 'ready')
  const inProgress = activeJobs.filter((j) => j.status === 'in_progress')
  const checkedIn = activeJobs.filter((j) => j.status === 'checked_in')

  const stats = [
    { label: 'Active Jobs', value: activeJobs.length, icon: Wrench, href: '/jobs' },
    { label: 'Ready for Pickup', value: readyForPickup.length, icon: CheckCircle, href: '/jobs?status=ready', highlight: readyForPickup.length > 0 },
    { label: 'In Progress', value: inProgress.length, icon: AlertCircle, href: '/jobs?status=in_progress' },
    { label: 'Customers', value: customerCount ?? 0, icon: Users, href: '/customers' },
  ]

  const taskGroups = groupTasksByDay((upcomingTasks || []) as TaskWithJob[])

  const colorMap: Record<string, { dot: string; label: string; dateText: string }> = {
    red:   { dot: 'bg-red-500',   label: 'text-red-600',   dateText: 'text-red-500' },
    amber: { dot: 'bg-amber-400', label: 'text-amber-700', dateText: 'text-amber-600' },
    blue:  { dot: 'bg-blue-400',  label: 'text-blue-700',  dateText: 'text-blue-500' },
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold text-black">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="page-content space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className={`card p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow ${stat.highlight ? 'border-green-300 bg-green-50' : ''}`}
            >
              <stat.icon size={20} className={stat.highlight ? 'text-green-600' : 'text-gray-400'} />
              <div>
                <div className={`text-2xl font-black ${stat.highlight ? 'text-green-700' : 'text-black'}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* This week at a glance */}
        {taskGroups.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar size={14} />
              This Week at a Glance
            </h2>
            <div className="space-y-3">
              {taskGroups.map(({ label, tasks, color }) => {
                const c = colorMap[color] ?? colorMap.blue
                return (
                  <div key={label}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${c.label}`}>
                      {label} ({tasks.length})
                    </p>
                    <div className="card divide-y divide-gray-100">
                      {tasks.map((task) => (
                        <Link
                          key={task.id}
                          href={`/jobs/${task.job?.id}`}
                          className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors block"
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{task.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {task.job?.customer?.name} · Job #{task.job?.job_number}
                            </p>
                          </div>
                          <span className={`text-xs font-medium shrink-0 ${c.dateText}`}>
                            {new Date(task.due_date! + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Ready for pickup */}
        {readyForPickup.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Ready for Collection
            </h2>
            <div className="space-y-2">
              {readyForPickup.map((job: Job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              In Progress
            </h2>
            <div className="space-y-2">
              {inProgress.map((job: Job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Checked in */}
        {checkedIn.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Recently Checked In
            </h2>
            <div className="space-y-2">
              {checkedIn.slice(0, 5).map((job: Job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {activeJobs.length === 0 && (
          <div className="card p-8 text-center">
            <Wrench size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No active jobs</p>
            <p className="text-gray-400 text-sm mt-1">Check in a bike to get started</p>
            <Link href="/jobs/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus size={16} />
              Check In a Bike
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function JobRow({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow block">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-black truncate">
            {job.customer?.name || 'Unknown customer'}
          </span>
          <span className="text-gray-400 text-xs">#{job.job_number}</span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {job.bike ? `${job.bike.year || ''} ${job.bike.make} ${job.bike.model}` : 'Unknown bike'}
          {job.bike?.registration && (
            <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
              {job.bike.registration}
            </span>
          )}
        </p>
        {job.customer_description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{job.customer_description}</p>
        )}
      </div>
      <StatusBadge status={job.status} />
    </Link>
  )
}
