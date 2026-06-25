import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Mail, MapPin, Bike, Plus, ChevronRight, MessageCircle } from 'lucide-react'
import { whatsappUrl } from '@/lib/whatsapp'
import type { Job } from '@/lib/types'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: customer }, { data: bikes }, { data: jobs }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('bikes').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('*, bike:bikes(make, model, year, registration)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!customer) notFound()

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/customers" className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">{customer.name.charAt(0).toUpperCase()}</span>
            </div>
            <h1 className="text-xl font-bold">{customer.name}</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 ml-9">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-black px-2 py-1 bg-gray-50 rounded-lg">
              {customer.phone}
            </a>
          )}
          {customer.phone && (
            <a
              href={whatsappUrl(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 px-2 py-1 bg-green-50 rounded-lg font-medium"
            >
              <MessageCircle size={13} />
              WhatsApp
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600">
              <Mail size={14} />
              {customer.email}
            </a>
          )}
          {customer.address && (
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin size={14} />
              {customer.address}
            </span>
          )}
        </div>

        {customer.notes && (
          <p className="text-sm text-gray-500 mt-2 ml-9">{customer.notes}</p>
        )}
      </div>

      <div className="page-content space-y-5">

        {/* Quick action */}
        <Link
          href={`/jobs/new`}
          className="btn-primary flex items-center justify-center gap-2 w-full py-3"
        >
          <Plus size={16} />
          Check In a Bike for {customer.name.split(' ')[0]}
        </Link>

        {/* Bikes */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Bikes ({bikes?.length || 0})</span>
          </h2>

          {!bikes?.length ? (
            <div className="card p-4 text-center text-sm text-gray-400">No bikes on record</div>
          ) : (
            <div className="card divide-y divide-gray-100">
              {bikes.map((bike) => (
                <div key={bike.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <Bike size={16} className="text-gray-400 shrink-0" />
                    <span className="font-semibold text-sm">
                      {bike.year ? `${bike.year} ` : ''}{bike.make} {bike.model}
                    </span>
                    {bike.registration && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {bike.registration}
                      </span>
                    )}
                  </div>
                  {bike.color && (
                    <p className="text-xs text-gray-400 mt-1 ml-6">{bike.color}</p>
                  )}
                  {bike.vin && (
                    <p className="text-xs text-gray-400 mt-0.5 ml-6">VIN: {bike.vin}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Job History ({jobs?.length || 0})
          </h2>

          {!jobs?.length ? (
            <div className="card p-4 text-center text-sm text-gray-400">No jobs yet</div>
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
                    {job.bike && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {job.bike.year ? `${job.bike.year} ` : ''}{job.bike.make} {job.bike.model}
                        {job.bike.registration && (
                          <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {job.bike.registration}
                          </span>
                        )}
                      </p>
                    )}
                    {job.customer_description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{job.customer_description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(job.check_in_date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                      {job.final_cost && (
                        <span className="ml-3 font-medium text-gray-600">
                          £{Number(job.final_cost).toFixed(2)}
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
