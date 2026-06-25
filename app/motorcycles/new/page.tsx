import { createClient } from '@/lib/supabase/server'
import { createBike } from '@/app/actions/bikes'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewMotorcyclePage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .order('name')

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/motorcycles" className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Add Bike</h1>
        </div>
      </div>

      <form action={createBike} className="page-content max-w-lg space-y-4">
        <div>
          <label className="label">Owner</label>
          <select className="input" name="customer_id">
            <option value="">-- No owner linked yet --</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Make *</label>
            <input className="input" name="make" required placeholder="Honda" />
          </div>
          <div>
            <label className="label">Model *</label>
            <input className="input" name="model" required placeholder="CBR600RR" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Year</label>
            <input className="input" name="year" type="number" placeholder="2020" min="1900" max="2030" />
          </div>
          <div>
            <label className="label">Colour</label>
            <input className="input" name="color" placeholder="Red" />
          </div>
        </div>

        <div>
          <label className="label">Registration</label>
          <input
            className="input uppercase tracking-widest font-mono"
            name="registration"
            placeholder="ABC 123 GP"
          />
          <p className="text-xs text-gray-400 mt-1">South African format: ABC 123 GP</p>
        </div>

        <div>
          <label className="label">
            VIN <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            className="input font-mono"
            name="vin"
            placeholder="e.g. JH2PC40J6XM200001"
            maxLength={17}
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            name="notes"
            rows={2}
            placeholder="Any notes about this bike..."
          />
        </div>

        <button type="submit" className="btn-primary w-full py-4">
          Save Bike
        </button>
      </form>
    </div>
  )
}
