import { createCustomer } from '@/app/actions/customers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewCustomerPage() {
  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">New Customer</h1>
        </div>
      </div>

      <form action={createCustomer} className="page-content max-w-lg space-y-4">
        <div>
          <label className="label">Full name *</label>
          <input className="input" name="name" required placeholder="e.g. Mike Thompson" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" name="phone" type="tel" placeholder="07700 900123" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" name="email" type="email" placeholder="mike@example.com" />
        </div>
        <div>
          <label className="label">Address</label>
          <textarea className="input resize-none" name="address" rows={2} placeholder="123 Main Street, Town, AB1 2CD" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" name="notes" rows={2} placeholder="Any notes about this customer..." />
        </div>
        <button type="submit" className="btn-primary w-full py-4">
          Save Customer
        </button>
      </form>
    </div>
  )
}
