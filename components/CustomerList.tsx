'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, ChevronRight, Search, X, Plus } from 'lucide-react'

type CustomerEntry = {
  id: string
  name: string
  phone: string | null
  bikes: { count: number }[]
  jobs: { count: number }[]
}

type SortMode = 'az' | 'most_bikes'

interface Props {
  customers: CustomerEntry[]
}

export default function CustomerList({ customers }: Props) {
  const [sort, setSort] = useState<SortMode>('az')
  const [search, setSearch] = useState('')

  const filtered = customers.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone?.replace(/\s/g, '').includes(search.replace(/\s/g, '')) ?? false)
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'most_bikes') {
      const aBikes = (a.bikes as unknown as { count: number }[])?.[0]?.count ?? 0
      const bBikes = (b.bikes as unknown as { count: number }[])?.[0]?.count ?? 0
      return bBikes - aBikes || a.name.localeCompare(b.name)
    }
    return a.name.localeCompare(b.name)
  })

  if (!customers.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500 font-medium">No customers yet</p>
        <Link href="/customers/new" className="btn-primary inline-flex items-center gap-2 mt-4">
          <Plus size={16} />
          Add First Customer
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="input pl-10 pr-10 text-base"
          placeholder="Search by name or phone..."
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

      {/* Sort toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSort('az')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
            sort === 'az'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          A – Z
        </button>
        <button
          onClick={() => setSort('most_bikes')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
            sort === 'most_bikes'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          Most Bikes
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {sorted.length} customer{sorted.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>

      {sorted.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-500 font-medium">No customers match your search</p>
          <button onClick={() => setSearch('')} className="text-sm text-red-600 mt-2 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((customer) => {
            const bikeCount = (customer.bikes as unknown as { count: number }[])?.[0]?.count ?? 0
            const jobCount = (customer.jobs as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow block"
              >
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{customer.name}</p>
                  {customer.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={12} />
                      {customer.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {bikeCount} bike{bikeCount !== 1 ? 's' : ''} · {jobCount} job{jobCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
