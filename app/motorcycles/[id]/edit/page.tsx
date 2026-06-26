import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { updateBike } from '@/app/actions/bikes'
import { COMMON_MAKES } from '@/lib/bike-makes'

export default async function BikeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: bike } = await supabase.from('bikes').select('*').eq('id', id).single()
  if (!bike) notFound()

  const action = updateBike.bind(null, id)

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/motorcycles/${id}`} className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Edit Bike</h1>
        </div>
      </div>

      <div className="page-content">
        <form action={action} className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Make *</label>
              <input className="input" name="make" list="bike-makes" defaultValue={bike.make} required />
            <datalist id="bike-makes">
              {COMMON_MAKES.map((m) => <option key={m} value={m} />)}
            </datalist>
            </div>
            <div>
              <label className="label">Model *</label>
              <input className="input" name="model" defaultValue={bike.model} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Year</label>
              <input className="input" name="year" type="number" defaultValue={bike.year ?? ''} placeholder="2020" />
            </div>
            <div>
              <label className="label">Colour</label>
              <input className="input" name="color" defaultValue={bike.color ?? ''} placeholder="e.g. Red" />
            </div>
          </div>
          <div>
            <label className="label">Registration plate</label>
            <input className="input font-mono" name="registration" defaultValue={bike.registration ?? ''} placeholder="ABC 123 GP" />
          </div>
          <div>
            <label className="label">VIN</label>
            <input className="input font-mono" name="vin" defaultValue={bike.vin ?? ''} placeholder="17-character VIN" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[80px] resize-none"
              name="notes"
              defaultValue={bike.notes ?? ''}
              placeholder="Any notes about this bike..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href={`/motorcycles/${id}`} className="btn-ghost flex-1 py-3 text-center text-sm font-medium">
              Cancel
            </Link>
            <button type="submit" className="btn-primary flex-1 py-3">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
