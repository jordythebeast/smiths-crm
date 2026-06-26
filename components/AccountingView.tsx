'use client'

import { Download, TrendingUp, Receipt, Bike } from 'lucide-react'

export type AccountingJob = {
  id: string
  job_number: number
  job_type: string
  check_in_date: string
  check_out_date: string | null
  customer_description: string | null
  work_performed: string | null
  parts_cost: number | null
  labour_cost: number | null
  tax_rate: number | null
  final_cost: number | null
  estimated_cost: number | null
  customer: { name: string } | null
  bike: { make: string; model: string; year: number | null; registration: string | null } | null
}

function fmt(n: number) {
  return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function exportCSV(jobs: AccountingJob[], period: string) {
  const headers = [
    'Job #', 'Date In', 'Date Out', 'Type', 'Customer',
    'Bike', 'Registration', 'Description',
    'Parts (R)', 'Labour (R)', 'VAT %', 'VAT (R)', 'Total (R)',
    'Bought For (R)', 'Sold For (R)', 'Margin (R)',
  ]

  const rows = jobs.map((j) => {
    const isBuySell = j.job_type === 'buy_sell'
    const parts = Number(j.parts_cost ?? 0)
    const labour = Number(j.labour_cost ?? 0)
    const subtotal = parts + labour
    const taxRate = Number(j.tax_rate ?? 15)
    const vat = isBuySell ? 0 : subtotal * (taxRate / 100)
    const total = Number(j.final_cost ?? 0)
    const boughtFor = isBuySell ? Number(j.estimated_cost ?? 0) : 0
    const soldFor = isBuySell ? total : 0
    const margin = isBuySell ? soldFor - boughtFor : 0
    const bike = j.bike
      ? `${j.bike.year ? j.bike.year + ' ' : ''}${j.bike.make} ${j.bike.model}`
      : ''

    const cell = (v: string | number) => {
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }

    return [
      j.job_number,
      fmtDate(j.check_in_date),
      fmtDate(j.check_out_date),
      isBuySell ? 'Buy & Sell' : 'Service & Repair',
      cell(j.customer?.name ?? ''),
      cell(bike),
      j.bike?.registration ?? '',
      cell(j.customer_description ?? j.work_performed ?? ''),
      isBuySell ? '' : parts.toFixed(2),
      isBuySell ? '' : labour.toFixed(2),
      isBuySell ? '' : taxRate,
      isBuySell ? '' : vat.toFixed(2),
      total.toFixed(2),
      isBuySell ? boughtFor.toFixed(2) : '',
      isBuySell ? soldFor.toFixed(2) : '',
      isBuySell ? margin.toFixed(2) : '',
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `smiths-accounting-${period}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AccountingView({
  jobs,
  period,
}: {
  jobs: AccountingJob[]
  period: string
}) {
  // Summary calculations
  let totalRevenue = 0
  let totalVat = 0
  let totalMargin = 0
  let serviceCount = 0
  let buySellCount = 0

  for (const j of jobs) {
    const isBuySell = j.job_type === 'buy_sell'
    const total = Number(j.final_cost ?? 0)
    totalRevenue += total
    if (isBuySell) {
      buySellCount++
      totalMargin += total - Number(j.estimated_cost ?? 0)
    } else {
      serviceCount++
      const parts = Number(j.parts_cost ?? 0)
      const labour = Number(j.labour_cost ?? 0)
      const taxRate = Number(j.tax_rate ?? 15)
      totalVat += (parts + labour) * (taxRate / 100)
    }
  }

  const periodLabel: Record<string, string> = {
    month: 'this-month',
    last_month: 'last-month',
    year: 'this-year',
    all: 'all-time',
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={15} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Revenue</span>
          </div>
          <p className="text-xl font-black">R {fmt(totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={15} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">VAT Collected</span>
          </div>
          <p className="text-xl font-black">R {fmt(totalVat)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{serviceCount} service job{serviceCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Buy & Sell Margin</span>
          </div>
          <p className={`text-xl font-black ${totalMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {totalMargin >= 0 ? '+' : ''}R {fmt(totalMargin)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{buySellCount} sale{buySellCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bike size={15} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Net (excl. VAT)</span>
          </div>
          <p className="text-xl font-black">R {fmt(totalRevenue - totalVat)}</p>
          <p className="text-xs text-gray-400 mt-0.5">All jobs combined</p>
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={() => exportCSV(jobs, periodLabel[period] ?? period)}
        disabled={jobs.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-black transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download size={16} />
        Export to Excel / QuickBooks (.csv) — {jobs.length} job{jobs.length !== 1 ? 's' : ''}
      </button>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 font-medium">No completed jobs in this period</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => {
            const isBuySell = j.job_type === 'buy_sell'
            const total = Number(j.final_cost ?? 0)
            const margin = isBuySell ? total - Number(j.estimated_cost ?? 0) : null

            return (
              <div key={j.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        #{j.job_number}
                      </span>
                      <span className="font-semibold text-sm">{j.customer?.name ?? '—'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isBuySell ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isBuySell ? 'Buy & Sell' : 'Service'}
                      </span>
                    </div>
                    {j.bike && (
                      <p className="text-xs text-gray-500 mt-1">
                        {j.bike.year ? `${j.bike.year} ` : ''}{j.bike.make} {j.bike.model}
                        {j.bike.registration && (
                          <span className="ml-2 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{j.bike.registration}</span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtDate(j.check_in_date)} → {fmtDate(j.check_out_date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-base">R {fmt(total)}</p>
                    {margin !== null && (
                      <p className={`text-xs font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {margin >= 0 ? '+' : ''}R {fmt(margin)} margin
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
