import { createClient } from '@/lib/supabase/server'
import NewJobForm from '@/components/NewJobForm'

export default async function NewJobPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone')
    .order('name')

  const { data: bikes } = await supabase
    .from('bikes')
    .select('id, customer_id, make, model, year, registration, color')
    .order('make')

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Check In a Bike</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a new workshop job</p>
      </div>
      <NewJobForm customers={customers || []} bikes={bikes || []} />
    </div>
  )
}
