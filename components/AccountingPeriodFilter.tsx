'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarRange } from 'lucide-react'

const PRESETS = [
  { value: 'month',      label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'year',       label: 'This year' },
  { value: 'all',        label: 'All time' },
]

export default function AccountingPeriodFilter({
  activePeriod,
  activeFrom,
  activeTo,
}: {
  activePeriod: string
  activeFrom?: string
  activeTo?: string
}) {
  const router = useRouter()
  const [showCustom, setShowCustom] = useState(activePeriod === 'custom')
  const [from, setFrom] = useState(activeFrom ?? '')
  const [to, setTo] = useState(activeTo ?? '')

  const isCustomActive = activePeriod === 'custom'

  function applyCustom() {
    if (!from || !to) return
    router.push(`/jobs?type=accounting&period=custom&from=${from}&to=${to}`)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <Link
            key={p.value}
            href={`/jobs?type=accounting&period=${p.value}`}
            onClick={() => setShowCustom(false)}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              activePeriod === p.value && !isCustomActive
                ? 'border-gray-800 bg-gray-800 text-white'
                : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {p.label}
          </Link>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border transition-colors ${
            isCustomActive || showCustom
              ? 'border-gray-800 bg-gray-800 text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
        >
          <CalendarRange size={14} />
          Custom range
        </button>
      </div>

      {showCustom && (
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="label text-xs">From</label>
            <input
              type="date"
              className="input text-sm py-2"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-xs">To</label>
            <input
              type="date"
              className="input text-sm py-2"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button
            onClick={applyCustom}
            disabled={!from || !to}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
