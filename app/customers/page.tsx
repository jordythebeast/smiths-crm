import { createClient } from '@/lib/supabase/server'
import CustomerList from '@/components/CustomerList'

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('*, bikes:bikes(count), jobs:jobs(count)')
    .order('name')

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Customers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Customer directory</p>
      </div>

      <div className="page-content">
        <CustomerList customers={customers || []} />
      </div>
    </div>
  )
}
