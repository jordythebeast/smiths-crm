'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { normaliseName } from '@/lib/utils'

export async function createBike(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bikes')
    .insert({
      customer_id: (formData.get('customer_id') as string) || null,
      make: normaliseName(formData.get('make') as string),
      model: normaliseName(formData.get('model') as string),
      year: formData.get('year') ? Number(formData.get('year')) : null,
      registration: (formData.get('registration') as string) || null,
      color: (formData.get('color') as string) || null,
      vin: (formData.get('vin') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })

  if (error) throw new Error(error.message)

  revalidatePath('/motorcycles')
  redirect('/motorcycles')
}

export async function updateBike(id: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bikes')
    .update({
      make: normaliseName(formData.get('make') as string),
      model: normaliseName(formData.get('model') as string),
      year: formData.get('year') ? Number(formData.get('year')) : null,
      registration: (formData.get('registration') as string) || null,
      color: (formData.get('color') as string) || null,
      vin: (formData.get('vin') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/motorcycles/${id}`)
  revalidatePath('/motorcycles')
  redirect(`/motorcycles/${id}`)
}
