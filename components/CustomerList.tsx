'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Phone, Search, X, Plus, Pencil, Trash2 } from 'lucide-react'
import { deleteCustomer } from '@/app/actions/customers'

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

export default function CustomerList({ customers: initial }: Props) {
  const [customers, setCustomers] = useState(initial)
  const [sort, setSort] = useState<SortMode>('az')
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  function handleDeleteClick(id: string) {
    setDeleteError(null)
    setConfirmId(id)
  }

  function handleConfirmDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCustomer(id)
      if (result.error) {
        setDeleteError(result.error)
        setConfirmId(null)
      } else {
        setCustomers((prev) => prev.filter((c) => c.id !== id))
        setConfirmId(null)
      }
    })
  }

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
            sort === 'az' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          A – Z
        </button>
        <button
          onClick={() => setSort('most_bikes')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
            sort === 'most_bikes' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          Most Bikes
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {sorted.length} customer{sorted.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
          {deleteError}
        </div>
      )}

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
            const canDelete = bikeCount === 0 && jobCount === 0
            const isConfirming = confirmId === customer.id

            return (
              <div key={customer.id} className="card overflow-hidden">
                {isConfirming ? (
                  <div className="p-4 bg-red-50 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-red-800">Delete {customer.name}?</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:border-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(customer.id)}
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
                      href={`/customers/${customer.id}`}
                      className="flex items-center gap-3 flex-1 p-4 min-w-0 hover:bg-gray-50 transition-colors"
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
                    </Link>
                    <div className="flex items-center gap-0.5 pr-2 shrink-0">
                      <Link
                        href={`/customers/${customer.id}/edit`}
                        className="p-2.5 text-gray-400 hover:text-black transition-colors rounded-lg"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => canDelete ? handleDeleteClick(customer.id) : setDeleteError('Cannot delete — customer has bikes or jobs on record.')}
                        className={`p-2.5 rounded-lg transition-colors ${canDelete ? 'text-gray-400 hover:text-red-500' : 'text-gray-200 cursor-not-allowed'}`}
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
