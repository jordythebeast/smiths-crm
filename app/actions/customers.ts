'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    address: (formData.get('address') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/customers')
  redirect(`/customers/${customer.id}`)
}

export async function createBuyer(params: {
  name: string
  phone: string
  bikeId: string
  jobId: string
  bikeDesc: string
}): Promise<string> {
  const supabase = await createClient()

  const { data: customer, error: custError } = await supabase
    .from('customers')
    .insert({
      name: params.name,
      phone: params.phone || null,
      notes: `Buyer — purchased ${params.bikeDesc}`,
    })
    .select()
    .single()
  if (custError) throw new Error(custError.message)

  await supabase.from('bikes').update({ customer_id: customer.id }).eq('id', params.bikeId)

  revalidatePath(`/jobs/${params.jobId}`)
  revalidatePath('/customers')
  revalidatePath('/motorcycles')
  return customer.id
}

export async function deleteCustomer(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const [{ count: bikeCount }, { count: jobCount }] = await Promise.all([
    supabase.from('bikes').select('*', { count: 'exact', head: true }).eq('customer_id', id),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('customer_id', id),
  ])

  if ((bikeCount ?? 0) > 0 || (jobCount ?? 0) > 0) {
    return { error: 'Cannot delete — customer has bikes or jobs on record.' }
  }

  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/customers')
  return {}
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    address: (formData.get('address') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const { error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/customers/${id}`)
  revalidatePath('/customers')
  redirect(`/customers/${id}`)
}
