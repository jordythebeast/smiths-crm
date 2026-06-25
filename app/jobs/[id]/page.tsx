import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import PhotoUpload from '@/components/PhotoUpload'
import JobStatusActions from '@/components/JobStatusActions'
import JobNotesForm from '@/components/JobNotesForm'
import TaskList from '@/components/TaskList'
import BuyerSection from '@/components/BuyerSection'
import CallLog from '@/components/CallLog'
import { ArrowLeft, Bike, MessageCircle } from 'lucide-react'
import { whatsappUrl, statusMessage } from '@/lib/whatsapp'
import type { Job } from '@/lib/types'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, bike:bikes(*), customer:customers(*), photos:job_photos(*), tasks(*), call_log:call_log(*)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const j = job as Job
  const isBuySell = j.job_type === 'buy_sell'
  const bikeDesc = j.bike
    ? `${j.bike.year ? j.bike.year + ' ' : ''}${j.bike.make} ${j.bike.model}`
    : 'bike'

  const firstName = j.customer?.name.split(' ')[0] ?? ''
  const waMessage = j.customer && j.bike
    ? statusMessage(firstName, j.bike, j.status, j.job_type)
    : undefined

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/jobs" className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Job #{j.job_number}</h1>
          <StatusBadge status={j.status} />
          {isBuySell && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
              Buy &amp; Sell
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 ml-8">
          Checked in {new Date(j.check_in_date).toLocaleDateString('en-ZA', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      <div className="page-content space-y-4">

        {/* Status actions */}
        <JobStatusActions jobId={j.id} currentStatus={j.status} jobType={j.job_type} />

        {/* WhatsApp — always visible when customer has phone */}
        {j.customer?.phone && j.status !== 'checked_out' && (
          <a
            href={whatsappUrl(j.customer.phone, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full font-semibold py-3 rounded-lg text-sm transition-colors ${
              j.status === 'ready'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-50 hover:bg-green-100 text-green-800 border border-green-200'
            }`}
          >
            <MessageCircle size={16} />
            {j.status === 'ready'
              ? `WhatsApp ${firstName} — Bike is ready!`
              : `WhatsApp ${firstName}`}
          </a>
        )}

        {/* Customer & Bike info */}
        <div className="card divide-y divide-gray-100">
          {j.customer && (
            <div className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Customer</p>
              <Link
                href={`/customers/${j.customer.id}`}
                className="font-semibold text-base hover:text-red-600 transition-colors"
              >
                {j.customer.name}
              </Link>
              <div className="flex flex-wrap gap-2 mt-2">
                {j.customer.phone && (
                  <a
                    href={`tel:${j.customer.phone}`}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-black px-2 py-1 bg-gray-50 rounded-lg"
                  >
                    {j.customer.phone}
                  </a>
                )}
                {j.customer.phone && (
                  <a
                    href={whatsappUrl(j.customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 px-2 py-1 bg-green-50 rounded-lg font-medium"
                  >
                    <MessageCircle size={13} />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {j.bike && (
            <div className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Bike</p>
              <Link href={`/motorcycles/${j.bike.id}`} className="flex items-center gap-2 hover:text-red-600 group">
                <Bike size={16} className="text-gray-400 shrink-0" />
                <span className="font-semibold group-hover:text-red-600">
                  {j.bike.year ? `${j.bike.year} ` : ''}{j.bike.make} {j.bike.model}
                </span>
                {j.bike.registration && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                    {j.bike.registration}
                  </span>
                )}
              </Link>
              {j.bike.color && (
                <p className="text-sm text-gray-500 mt-1 ml-6">{j.bike.color}</p>
              )}
              {j.odometer_in && (
                <p className="text-sm text-gray-500 mt-1 ml-6">
                  Odometer in: {j.odometer_in.toLocaleString()} km
                </p>
              )}
            </div>
          )}
        </div>

        {/* Issue reported */}
        {j.customer_description && (
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">
              {isBuySell ? 'Notes' : 'Issue Reported'}
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{j.customer_description}</p>
          </div>
        )}

        {/* Damage / condition notes */}
        {j.damage_notes && (
          <div className="card p-4 border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-700 uppercase tracking-wider font-medium mb-2">Existing Damage / Condition</p>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{j.damage_notes}</p>
          </div>
        )}

        {/* Call log */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Call Log / Notes</p>
          <CallLog jobId={j.id} initialNotes={j.call_log || []} />
        </div>

        {/* Photos */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Photos</p>
          <PhotoUpload jobId={j.id} existingPhotos={j.photos || []} />
        </div>

        {/* Tasks */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Tasks</p>
          <TaskList jobId={j.id} initialTasks={j.tasks || []} />
        </div>

        {/* Work notes & costs */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">
            {isBuySell ? 'Buy & Sell Details' : 'Work Notes & Invoice'}
          </p>
          <JobNotesForm job={j} />
        </div>

        {/* Buyer section — shown when buy_sell bike is sold */}
        {isBuySell && j.status === 'checked_out' && j.bike && (
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Buyer</p>
            <BuyerSection
              jobId={j.id}
              bikeId={j.bike.id}
              bikeDesc={bikeDesc}
              existingBuyer={j.bike.customer_id && j.customer?.id !== j.bike.customer_id
                ? null
                : null}
            />
          </div>
        )}

        {/* Completed summary */}
        {j.status === 'checked_out' && j.check_out_date && (
          <div className="card p-4 bg-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
              {isBuySell ? 'Sold' : 'Completed'}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(j.check_out_date).toLocaleDateString('en-ZA', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
            {j.final_cost && (
              <p className="text-xl font-bold mt-1">R {Number(j.final_cost).toFixed(2)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
