'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { UserPlus, Check } from 'lucide-react'
import { createBuyer } from '@/app/actions/customers'

interface Props {
  jobId: string
  bikeId: string
  bikeDesc: string
  existingBuyer?: { id: string; name: string } | null
}

export default function BuyerSection({ jobId, bikeId, bikeDesc, existingBuyer }: Props) {
  const [done, setDone] = useState(false)
  const [buyerId, setBuyerId] = useState<string | null>(existingBuyer?.id ?? null)
  const [buyerName, setBuyerName] = useState(existingBuyer?.name ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (done || buyerId) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
        <Check size={16} className="text-green-600 shrink-0" />
        <p className="text-sm text-green-800">
          Buyer recorded:{' '}
          <Link href={`/customers/${buyerId}`} className="font-semibold hover:underline">
            {buyerName}
          </Link>
        </p>
      </div>
    )
  }

  function handleSubmit() {
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        const id = await createBuyer({ name: name.trim(), phone, bikeId, jobId, bikeDesc })
        setBuyerId(id)
        setBuyerName(name.trim())
        setDone(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Who bought this bike? Add them as a customer so you have a record.</p>
      <div className="space-y-2">
        <input
          className="input"
          placeholder="Buyer's name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || isPending}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={15} />
          {isPending ? 'Saving...' : 'Add Buyer'}
        </button>
        <button onClick={() => setDone(true)} className="btn-ghost text-sm">
          Skip
        </button>
      </div>
    </div>
  )
}
