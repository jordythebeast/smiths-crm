'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateJobNotes } from '@/app/actions/jobs'
import type { Job } from '@/lib/types'
import { CheckCircle, AlertCircle } from 'lucide-react'

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

export default function JobNotesForm({ job }: { job: Job }) {
  const action = updateJobNotes.bind(null, job.id)
  const isBuySell = job.job_type === 'buy_sell'

  const [parts, setParts] = useState(job.parts_cost ? String(job.parts_cost) : '')
  const [labour, setLabour] = useState(job.labour_cost ? String(job.labour_cost) : '')
  const [taxRate, setTaxRate] = useState(job.tax_rate ?? 15)
  const [boughtFor, setBoughtFor] = useState(job.estimated_cost ? String(job.estimated_cost) : '')
  const [acknowledged, setAcknowledged] = useState(job.customer_acknowledged ?? false)

  const partsNum = parseFloat(parts) || 0
  const labourNum = parseFloat(labour) || 0
  const subtotal = partsNum + labourNum
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const soldFor = job.final_cost ? Number(job.final_cost) : 0
  const boughtForNum = parseFloat(boughtFor) || 0
  const margin = soldFor - boughtForNum

  return (
    <form action={action} className="space-y-4">
      {!isBuySell && (
        <div>
          <label className="label">Work performed</label>
          <textarea
            className="input min-h-[100px] resize-none"
            name="work_performed"
            defaultValue={job.work_performed || ''}
            placeholder="Describe what was done..."
          />
        </div>
      )}

      <div>
        <label className="label">Condition notes</label>
        <textarea
          className="input min-h-[60px] resize-none"
          name="damage_notes"
          defaultValue={job.damage_notes || ''}
          placeholder="Any damage or condition notes..."
        />
      </div>

      {/* Invoice section */}
      {isBuySell ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buy &amp; Sell</p>
          <div>
            <label className="label">Bought for (R)</label>
            <input
              className="input"
              name="estimated_cost"
              type="number"
              step="0.01"
              value={boughtFor}
              onChange={(e) => setBoughtFor(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Sold for (R)</label>
            <input
              className="input"
              name="final_cost"
              type="number"
              step="0.01"
              defaultValue={job.final_cost ?? ''}
              placeholder="0.00"
            />
          </div>
          {(boughtForNum > 0 || soldFor > 0) && (
            <div className={`flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 ${margin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              <span>Margin</span>
              <span>{margin >= 0 ? '+' : ''}R {margin.toFixed(2)}</span>
            </div>
          )}
          <input type="hidden" name="parts_cost" value="" />
          <input type="hidden" name="labour_cost" value="" />
          <input type="hidden" name="tax_rate" value="0" />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Parts (R)</label>
              <input
                className="input"
                name="parts_cost"
                type="number"
                step="0.01"
                value={parts}
                onChange={(e) => setParts(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Labour (R)</label>
              <input
                className="input"
                name="labour_cost"
                type="number"
                step="0.01"
                value={labour}
                onChange={(e) => setLabour(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="label mb-0 shrink-0 text-xs">VAT rate (%)</label>
            <input
              className="input w-20 text-center text-sm"
              name="tax_rate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
            <span className="text-xs text-gray-400">Standard SA VAT is 15%</span>
          </div>

          {(partsNum > 0 || labourNum > 0) && (
            <div className="space-y-1.5 pt-1 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>R {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>VAT ({taxRate}%)</span>
                <span>R {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-black text-base pt-1 border-t border-gray-300">
                <span>Total</span>
                <span>R {total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <input type="hidden" name="final_cost" value={(subtotal > 0 ? total : (job.final_cost ?? '')).toString()} />
          <input type="hidden" name="estimated_cost" value="" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Odometer out (km)</label>
          <input
            className="input"
            name="odometer_out"
            type="number"
            defaultValue={job.odometer_out ?? ''}
            placeholder="km"
          />
        </div>
      </div>

      {/* Customer acknowledged — prominent toggle */}
      <button
        type="button"
        onClick={() => setAcknowledged(!acknowledged)}
        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
          acknowledged
            ? 'bg-green-50 border-green-300'
            : 'bg-amber-50 border-amber-300'
        }`}
      >
        {acknowledged
          ? <CheckCircle size={20} className="text-green-600 shrink-0" />
          : <AlertCircle size={20} className="text-amber-500 shrink-0" />
        }
        <div>
          <p className={`text-sm font-semibold ${acknowledged ? 'text-green-800' : 'text-amber-800'}`}>
            {acknowledged
              ? 'Customer acknowledged bike condition'
              : 'Customer has NOT acknowledged bike condition'}
          </p>
          <p className={`text-xs mt-0.5 ${acknowledged ? 'text-green-600' : 'text-amber-600'}`}>
            {acknowledged
              ? 'Tap to unmark'
              : 'Tap to confirm customer has seen and agreed to the bike condition'}
          </p>
        </div>
      </button>
      <input type="hidden" name="customer_acknowledged" value={acknowledged ? 'on' : ''} />

      <SaveButton />
    </form>
  )
}
