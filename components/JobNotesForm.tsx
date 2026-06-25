'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateJobNotes } from '@/app/actions/jobs'
import type { Job } from '@/lib/types'

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
  const [taxRate] = useState(job.tax_rate ?? 15)

  const partsNum = parseFloat(parts) || 0
  const labourNum = parseFloat(labour) || 0
  const subtotal = partsNum + labourNum
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const soldFor = job.final_cost ? Number(job.final_cost) : 0
  const boughtFor = job.estimated_cost ? Number(job.estimated_cost) : 0
  const margin = soldFor - boughtFor

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

      {/* ── Invoice section ── */}
      {isBuySell ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buy &amp; Sell</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bought for</span>
            <span className="font-semibold">R {boughtFor.toFixed(2)}</span>
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
          {soldFor > 0 && (
            <div className={`flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 ${margin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              <span>Margin</span>
              <span>{margin >= 0 ? '+' : ''}R {margin.toFixed(2)}</span>
            </div>
          )}
          {/* Hidden passthrough fields not used for buy_sell */}
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

          {/* Submit the computed total */}
          <input type="hidden" name="final_cost" value={(subtotal > 0 ? total : (job.final_cost ?? '')).toString()} />
          <input type="hidden" name="tax_rate" value={String(taxRate)} />
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

      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="customer_acknowledged"
          name="customer_acknowledged"
          defaultChecked={job.customer_acknowledged}
          className="w-5 h-5 rounded text-red-600 focus:ring-red-600"
        />
        <label htmlFor="customer_acknowledged" className="text-sm font-medium text-gray-700">
          Customer acknowledged bike condition
        </label>
      </div>

      <SaveButton />
    </form>
  )
}
