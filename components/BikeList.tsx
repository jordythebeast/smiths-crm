'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Bike, Search, X } from 'lucide-react'

type BikeEntry = {
  id: string
  make: string
  model: string
  year: number | null
  registration: string | null
  color: string | null
  vin: string | null
  customer: { id: string; name: string } | null
}

interface Props {
  bikes: BikeEntry[]
}

export default function BikeList({ bikes }: Props) {
  const [search, setSearch] = useState('')
  const [selectedMake, setSelectedMake] = useState<string | null>(null)

  const makes = Array.from(new Set(bikes.map((b) => b.make))).sort()

  const filtered = bikes.filter((bike) => {
    if (selectedMake && bike.make !== selectedMake) return false
    if (search) {
      const q = search.toLowerCase().replace(/\s/g, '')
      const reg = (bike.registration ?? '').toLowerCase().replace(/\s/g, '')
      if (
        !bike.make.toLowerCase().includes(search.toLowerCase()) &&
        !bike.model.toLowerCase().includes(search.toLowerCase()) &&
        !reg.includes(q) &&
        !(bike.customer?.name.toLowerCase().includes(search.toLowerCase()))
      ) {
        return false
      }
    }
    return true
  })

  const hasFilters = search || selectedMake

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

      {/* Make chips + Year dropdown on same row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedMake(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedMake
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {makes.map((make) => (
          <button
            key={make}
            onClick={() => setSelectedMake(selectedMake === make ? null : make)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedMake === make
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {make}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedMake(null) }}
            className="text-xs text-red-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {!hasFilters && (
        <p className="text-xs text-gray-400">{bikes.length} bike{bikes.length !== 1 ? 's' : ''}</p>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Bike size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bikes match your search</p>
          <button
            onClick={() => { setSearch(''); setSelectedMake(null) }}
            className="text-sm text-red-600 mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((bike) => (
            <Link
              key={bike.id}
              href={`/motorcycles/${bike.id}`}
              className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow block"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <Bike size={18} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {bike.year ? `${bike.year} ` : ''}{bike.make} {bike.model}
                  {bike.color ? ` · ${bike.color}` : ''}
                </p>
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
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
