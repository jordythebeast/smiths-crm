'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bike, Search, X, Pencil, Trash2 } from 'lucide-react'
import { deleteBike } from '@/app/actions/bikes'

type JobSummary = {
  id: string
  status: string
  job_type: string
  created_at: string
}

type BikeStatus = 'in_workshop' | 'for_sale' | 'being_prepped' | 'sold' | 'with_owner'

type BikeEntry = {
  id: string
  make: string
  model: string
  year: number | null
  registration: string | null
  color: string | null
  vin: string | null
  customer: { id: string; name: string } | null
  jobs: JobSummary[] | null
}

const STATUS_CONFIG: Record<BikeStatus, { label: string; className: string }> = {
  in_workshop:   { label: 'In Workshop',   className: 'bg-amber-100 text-amber-700' },
  being_prepped: { label: 'Being Prepped', className: 'bg-blue-100 text-blue-700' },
  for_sale:      { label: 'For Sale',      className: 'bg-green-100 text-green-700' },
  sold:          { label: 'Sold',          className: 'bg-gray-100 text-gray-500' },
  with_owner:    { label: 'With Owner',    className: 'bg-gray-50 text-gray-400 border border-gray-200' },
}

const STATUS_FILTERS: Array<{ value: BikeStatus | 'all'; label: string }> = [
  { value: 'all',           label: 'All' },
  { value: 'in_workshop',   label: 'In Workshop' },
  { value: 'for_sale',      label: 'For Sale' },
  { value: 'being_prepped', label: 'Being Prepped' },
  { value: 'with_owner',    label: 'With Owner' },
  { value: 'sold',          label: 'Sold' },
]

function getBikeStatus(jobs: JobSummary[] | null): BikeStatus {
  if (!jobs?.length) return 'with_owner'
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const activeJob = sorted.find((j) => j.status !== 'checked_out')
  if (activeJob) {
    if (activeJob.job_type === 'buy_sell') {
      return activeJob.status === 'ready' ? 'for_sale' : 'being_prepped'
    }
    return 'in_workshop'
  }
  return sorted[0].job_type === 'buy_sell' ? 'sold' : 'with_owner'
}

export default function BikeList({ bikes: initial }: { bikes: BikeEntry[] }) {
  const [bikes, setBikes] = useState(initial)
  const [search, setSearch] = useState('')
  const [selectedMake, setSelectedMake] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<BikeStatus | 'all'>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const makes = Array.from(new Set(bikes.map((b) => b.make))).sort()
  const bikesWithStatus = bikes.map((b) => ({ ...b, _status: getBikeStatus(b.jobs) }))

  const filtered = bikesWithStatus.filter((bike) => {
    if (selectedMake && bike.make !== selectedMake) return false
    if (selectedStatus !== 'all' && bike._status !== selectedStatus) return false
    if (search) {
      const q = search.toLowerCase().replace(/\s/g, '')
      const reg = (bike.registration ?? '').toLowerCase().replace(/\s/g, '')
      if (
        !bike.make.toLowerCase().includes(search.toLowerCase()) &&
        !bike.model.toLowerCase().includes(search.toLowerCase()) &&
        !reg.includes(q) &&
        !bike.customer?.name.toLowerCase().includes(search.toLowerCase())
      ) return false
    }
    return true
  })

  const hasFilters = !!(search || selectedMake || selectedStatus !== 'all')

  function clearAll() {
    setSearch('')
    setSelectedMake(null)
    setSelectedStatus('all')
  }

  function handleDeleteClick(id: string, hasJobs: boolean) {
    setDeleteError(null)
    if (hasJobs) {
      setDeleteError('Cannot delete — this bike has jobs on record.')
      return
    }
    setConfirmId(id)
  }

  function handleConfirmDelete(id: string) {
    startTransition(async () => {
      const result = await deleteBike(id)
      if (result.error) {
        setDeleteError(result.error)
        setConfirmId(null)
      } else {
        setBikes((prev) => prev.filter((b) => b.id !== id))
        setConfirmId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="input pl-10 pr-10 text-base"
          placeholder="Search make, model, plate or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Make chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedMake(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedMake ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {makes.map((make) => (
          <button
            key={make}
            onClick={() => setSelectedMake(selectedMake === make ? null : make)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedMake === make ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {make}
          </button>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedStatus === f.value
                ? 'bg-red-600 text-white border-red-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count + clear */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {filtered.length} bike{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' matched' : ''}
        </p>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-red-600 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
          {deleteError}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Bike size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bikes match your search</p>
          <button onClick={clearAll} className="text-sm text-red-600 mt-2 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((bike) => {
            const statusCfg = STATUS_CONFIG[bike._status]
            const hasJobs = (bike.jobs?.length ?? 0) > 0
            const isConfirming = confirmId === bike.id

            return (
              <div key={bike.id} className="card overflow-hidden">
                {isConfirming ? (
                  <div className="p-4 bg-red-50 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-red-800">
                      Delete {bike.year ? `${bike.year} ` : ''}{bike.make} {bike.model}?
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(bike.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        {isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Link
                      href={`/motorcycles/${bike.id}`}
                      className="flex items-center gap-3 flex-1 p-4 min-w-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <Bike size={18} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">
                            {bike.year ? `${bike.year} ` : ''}{bike.make} {bike.model}
                            {bike.color ? ` · ${bike.color}` : ''}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {bike.registration && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono font-semibold tracking-wider">
                              {bike.registration}
                            </span>
                          )}
                          {bike.vin && (
                            <span className="text-xs text-gray-400 font-mono truncate">VIN: {bike.vin}</span>
                          )}
                        </div>
                        {bike.customer && (
                          <p className="text-xs text-gray-500 mt-0.5">{bike.customer.name}</p>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-0.5 pr-2 shrink-0">
                      <Link
                        href={`/motorcycles/${bike.id}/edit`}
                        className="p-2.5 text-gray-400 hover:text-black transition-colors rounded-lg"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(bike.id, hasJobs)}
                        className={`p-2.5 rounded-lg transition-colors ${!hasJobs ? 'text-gray-400 hover:text-red-500' : 'text-gray-200 cursor-not-allowed'}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
