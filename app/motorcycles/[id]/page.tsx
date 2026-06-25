import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Bike, User, ChevronRight } from 'lucide-react'
import type { Job } from '@/lib/types'

export default async function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: bike }, { data: jobs }] = await Promise.all([
    supabase
      .from('bikes')
      .select('*, customer:customers(id, name, phone, email)')
      .eq('id', id)
      .single(),
    supabase
      .from('jobs')
      .select('*, customer:customers(name)')
      .eq('bike_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!bike) notFound()

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/motorcycles" className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <Bike size={18} className="text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">
                {bike.year ? `${bike.year} ` : ''}{bike.make} {bike.model}
              </h1>
              {bike.color && <p className="text-sm text-gray-500">{bike.color}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-[52px]">
          {bike.registration && (
            <span className="text-sm bg-gray-100 px-3 py-1 rounded font-mono font-semibold tracking-widest">
              {bike.registration}
            </span>
          )}
          {bike.vin && (
            <span className="text-xs text-gray-400 font-mono">VIN: {bike.vin}</span>
          )}
        </div>
      </div>

      <div className="page-content space-y-5">

        {/* Owner */}
        <div className="card divide-y divide-gray-100">
          <div className="p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Owner</p>
            {bike.customer ? (
              <Link
                href={`/customers/${bike.customer.id}`}
                className="flex items-center gap-2 hover:text-red-600 transition-colors group"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xs">
                    {bike.customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover:text-red-600">{bike.customer.name}</p>
                  {bike.customer.phone && (
                    <p className="text-xs text-gray-500">{bike.customer.phone}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-400 ml-auto" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <User size={16} />
                <span className="text-sm">No owner linked</span>
              </div>
            )}
          </div>

          {bike.notes && (
            <div className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-700">{bike.notes}</p>
            </div>
          )}
        </div>

        {/* Quick action */}
        <Link
          href="/jobs/new"
          className="btn-primary flex items-center justify-center gap-2 w-full py-3"
        >
          Check In This Bike
        </Link>

        {/* Job history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Job History ({jobs?.length || 0})
          </h2>

          {!jobs?.length ? (
            <div className="card p-4 text-center text-sm text-gray-400">No jobs yet for this bike</div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job: Job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">Job #{job.job_number}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    {job.customer_description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{job.customer_description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(job.check_in_date).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {job.final_cost && (
                        <span className="ml-3 font-medium text-gray-600">
                          R {Number(job.final_cost).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
