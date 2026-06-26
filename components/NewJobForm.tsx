'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createJobReturnId } from '@/app/actions/jobs'
import PhotoUpload from '@/components/PhotoUpload'
import { ChevronRight, ChevronLeft, CheckCircle, Wrench, Tag } from 'lucide-react'

interface Customer { id: string; name: string; phone: string | null }
interface Bike { id: string; customer_id: string | null; make: string; model: string; year: number | null; registration: string | null; color: string | null }

interface Props {
  customers: Customer[]
  bikes: Bike[]
}

function formatSAPlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length <= 3) return clean
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)}`
}

export default function NewJobForm({ customers, bikes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [jobType, setJobType] = useState<'service' | 'buy_sell'>('service')

  // Step 1: Customer
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })

  // Step 2: Bike
  const [bikeMode, setBikeMode] = useState<'existing' | 'new'>('existing')
  const [selectedBikeId, setSelectedBikeId] = useState('')
  const [newBike, setNewBike] = useState({ make: '', model: '', year: '', registration: '', color: '', vin: '' })

  // Step 3: Job details
  const [jobDetails, setJobDetails] = useState({
    customer_description: '',
    damage_notes: '',
    odometer_in: '',
    estimated_cost: '',
  })

  // Step 4: created job id for photo upload
  const [createdJobId, setCreatedJobId] = useState<string | null>(null)

  const customerBikes = bikes.filter((b) => b.customer_id === selectedCustomerId)
  const hasExistingBikes = customerMode === 'existing' && customerBikes.length > 0

  function handleCustomerChange(id: string) {
    setSelectedCustomerId(id)
    setSelectedBikeId('')
    setBikeMode('existing')
  }

  const canProceedStep1 =
    customerMode === 'existing' ? selectedCustomerId !== '' : newCustomer.name.trim() !== ''

  const canProceedStep2 = hasExistingBikes
    ? (bikeMode === 'existing' ? selectedBikeId !== '' : newBike.make.trim() !== '' && newBike.model.trim() !== '')
    : newBike.make.trim() !== '' && newBike.model.trim() !== ''

  function handleCreateJob() {
    setError(null)
    const isNewBike = !hasExistingBikes || bikeMode === 'new'
    startTransition(async () => {
      try {
        const jobId = await createJobReturnId({
          job_type: jobType,
          customer_id: customerMode === 'existing' ? selectedCustomerId : undefined,
          new_customer_name: customerMode === 'new' ? newCustomer.name : undefined,
          new_customer_phone: customerMode === 'new' ? newCustomer.phone || undefined : undefined,
          new_customer_email: customerMode === 'new' ? newCustomer.email || undefined : undefined,
          bike_id: !isNewBike ? selectedBikeId : undefined,
          new_bike_make: isNewBike ? newBike.make : undefined,
          new_bike_model: isNewBike ? newBike.model : undefined,
          new_bike_year: isNewBike && newBike.year ? Number(newBike.year) : null,
          new_bike_registration: isNewBike ? newBike.registration || undefined : undefined,
          new_bike_color: isNewBike ? newBike.color || undefined : undefined,
          new_bike_vin: isNewBike ? newBike.vin || undefined : undefined,
          customer_description: jobDetails.customer_description || undefined,
          damage_notes: jobDetails.damage_notes || undefined,
          odometer_in: jobDetails.odometer_in ? Number(jobDetails.odometer_in) : null,
          estimated_cost: jobDetails.estimated_cost ? Number(jobDetails.estimated_cost) : null,
        })
        setCreatedJobId(jobId)
        setStep(4)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="page-content max-w-lg">
      {/* Step 0: Job type */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-base">What type of job?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setJobType('service'); setStep(1) }}
              className="card p-5 flex flex-col items-center gap-3 hover:border-red-400 hover:shadow-sm transition-all text-left"
            >
              <Wrench size={28} className="text-gray-500" />
              <div>
                <p className="font-semibold text-sm">Service / Repair</p>
                <p className="text-xs text-gray-400 mt-0.5">Customer drops off a bike for work</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setJobType('buy_sell'); setStep(1) }}
              className="card p-5 flex flex-col items-center gap-3 hover:border-red-400 hover:shadow-sm transition-all text-left"
            >
              <Tag size={28} className="text-gray-500" />
              <div>
                <p className="font-semibold text-sm">Buy &amp; Sell</p>
                <p className="text-xs text-gray-400 mt-0.5">Bike coming in to be sold or bought</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Customer */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
            <h2 className="font-semibold text-base">Who&apos;s the customer?</h2>
          </div>

          <div className="flex gap-2">
            {(['existing', 'new'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCustomerMode(mode)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  customerMode === mode ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {mode === 'existing' ? 'Existing customer' : 'New customer'}
              </button>
            ))}
          </div>

          {customerMode === 'existing' ? (
            <div>
              <label className="label">Select customer</label>
              <select
                className="input"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">-- Choose a customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` · ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Full name *</label>
                <input
                  className="input"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Thabo Nkosi"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="082 555 1234"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                  placeholder="thabo@example.com"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {customerMode === 'new' ? 'Confirm new customer' : 'Next: Bike details'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Bike */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
            <h2 className="font-semibold text-base">Which bike?</h2>
          </div>

          {hasExistingBikes && (
            <div className="flex gap-2">
              {(['existing', 'new'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBikeMode(mode)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    bikeMode === mode ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {mode === 'existing' ? 'Existing bike' : 'Different bike'}
                </button>
              ))}
            </div>
          )}

          {hasExistingBikes && bikeMode === 'existing' ? (
            <div>
              <label className="label">Select bike</label>
              <select
                className="input"
                value={selectedBikeId}
                onChange={(e) => setSelectedBikeId(e.target.value)}
              >
                <option value="">-- Choose a bike --</option>
                {customerBikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.year ? `${b.year} ` : ''}{b.make} {b.model}
                    {b.registration ? ` · ${b.registration}` : ''}
                    {b.color ? ` · ${b.color}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Make *</label>
                  <input
                    className="input"
                    value={newBike.make}
                    onChange={(e) => setNewBike((p) => ({ ...p, make: e.target.value }))}
                    placeholder="Honda"
                  />
                </div>
                <div>
                  <label className="label">Model *</label>
                  <input
                    className="input"
                    value={newBike.model}
                    onChange={(e) => setNewBike((p) => ({ ...p, model: e.target.value }))}
                    placeholder="CBR600RR"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Year</label>
                  <input
                    className="input"
                    type="number"
                    value={newBike.year}
                    onChange={(e) => setNewBike((p) => ({ ...p, year: e.target.value }))}
                    placeholder="2020"
                    min="1900"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="label">Colour</label>
                  <input
                    className="input"
                    value={newBike.color}
                    onChange={(e) => setNewBike((p) => ({ ...p, color: e.target.value }))}
                    placeholder="Red"
                  />
                </div>
              </div>
              <div>
                <label className="label">Registration</label>
                <input
                  className="input uppercase tracking-widest font-mono"
                  value={newBike.registration}
                  onChange={(e) => setNewBike((p) => ({ ...p, registration: formatSAPlate(e.target.value) }))}
                  placeholder="ABC 123 GP"
                  maxLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">South African format: ABC 123 GP</p>
              </div>
              <div>
                <label className="label">
                  VIN <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className="input font-mono"
                  value={newBike.vin}
                  onChange={(e) => setNewBike((p) => ({ ...p, vin: e.target.value.toUpperCase() }))}
                  placeholder="e.g. JH2PC40J6XM200001"
                  maxLength={17}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-ghost flex items-center gap-2">
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {!hasExistingBikes || bikeMode === 'new' ? 'Confirm new bike' : 'Next: Job details'}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Job details */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
            <h2 className="font-semibold text-base">Job details</h2>
          </div>

          <div>
            <label className="label">What&apos;s the issue? (customer says)</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={jobDetails.customer_description}
              onChange={(e) => setJobDetails((p) => ({ ...p, customer_description: e.target.value }))}
              placeholder="e.g. Engine won't start, strange noise from front end..."
            />
          </div>

          <div>
            <label className="label">Existing damage / condition notes</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={jobDetails.damage_notes}
              onChange={(e) => setJobDetails((p) => ({ ...p, damage_notes: e.target.value }))}
              placeholder="e.g. Scratch on left fairing, crack in windshield..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Odometer (km)</label>
              <input
                className="input"
                type="number"
                value={jobDetails.odometer_in}
                onChange={(e) => setJobDetails((p) => ({ ...p, odometer_in: e.target.value }))}
                placeholder="12500"
              />
            </div>
            <div>
              <label className="label">Estimate (R)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={jobDetails.estimated_cost}
                onChange={(e) => setJobDetails((p) => ({ ...p, estimated_cost: e.target.value }))}
                placeholder="1500.00"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="btn-ghost flex items-center gap-2">
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              type="button"
              onClick={handleCreateJob}
              disabled={isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isPending ? 'Creating job...' : 'Next: Add photos'}
              {!isPending && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Photos */}
      {step === 4 && createdJobId && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold">4</span>
            <h2 className="font-semibold text-base">Check-in photos</h2>
          </div>

          <p className="text-sm text-gray-500">
            Take photos of the bike&apos;s current condition. Tap the camera icon to use your phone camera or choose from your gallery.
          </p>

          <PhotoUpload jobId={createdJobId} existingPhotos={[]} />

          <button
            type="button"
            onClick={() => router.push(`/jobs/${createdJobId}`)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4"
          >
            <CheckCircle size={18} />
            Done — View Job
          </button>

          <button
            type="button"
            onClick={() => router.push(`/jobs/${createdJobId}`)}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            Skip photos for now
          </button>
        </div>
      )}

      {/* Progress bar — only shown once job type is chosen */}
      {step > 0 && (
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-red-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
