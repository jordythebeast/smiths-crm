import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { updateCustomer } from '@/app/actions/customers'

export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) notFound()

  const action = updateCustomer.bind(null, id)

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/customers/${id}`} className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Edit Customer</h1>
        </div>
      </div>

      <div className="page-content">
        <form action={action} className="card p-5 space-y-4">
          <div>
            <label className="label">Full name *</label>
            <input className="input" name="name" defaultValue={customer.name} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" name="phone" type="tel" defaultValue={customer.phone ?? ''} placeholder="082 000 0000" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" defaultValue={customer.email ?? ''} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" name="address" defaultValue={customer.address ?? ''} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[80px] resize-none"
              name="notes"
              defaultValue={customer.notes ?? ''}
              placeholder="e.g. Prefers cash, only calls after 5pm..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href={`/customers/${id}`} className="btn-ghost flex-1 py-3 text-center text-sm font-medium">
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
