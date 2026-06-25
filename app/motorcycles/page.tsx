import { createClient } from '@/lib/supabase/server'
import { Bike } from 'lucide-react'
import BikeList from '@/components/BikeList'

export default async function MotorcyclesPage() {
  const supabase = await createClient()

  const { data: bikes } = await supabase
    .from('bikes')
    .select('*, customer:customers(id, name), jobs(id, status, job_type, created_at)')
    .order('make')

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Motorcycles</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bike inventory</p>
      </div>

      <div className="page-content">
        {!bikes?.length ? (
          <div className="card p-8 text-center">
            <Bike size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No bikes yet</p>
            <p className="text-gray-400 text-sm mt-1">Bikes are added during check-in or via Add Bike</p>
          </div>
        ) : (
          <BikeList bikes={bikes} />
        )}
      </div>
    </div>
  )
}
