'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { JobStatus } from '@/lib/types'
import { sendPushToAll } from './notifications'
import { normaliseName } from '@/lib/utils'

export async function createJob(formData: FormData) {
  const supabase = await createClient()

  let customerId = formData.get('customer_id') as string | null
  let bikeId = formData.get('bike_id') as string | null

  // Create new customer if needed
  if (!customerId || customerId === 'new') {
    const { data: newCustomer, error: custError } = await supabase
      .from('customers')
      .insert({
        name: formData.get('new_customer_name') as string,
        phone: (formData.get('new_customer_phone') as string) || null,
        email: (formData.get('new_customer_email') as string) || null,
      })
      .select()
      .single()
    if (custError) throw new Error(custError.message)
    customerId = newCustomer.id
  }

  // Create new bike if needed
  if (!bikeId || bikeId === 'new') {
    const { data: newBike, error: bikeError } = await supabase
      .from('bikes')
      .insert({
        customer_id: customerId,
        make: formData.get('new_bike_make') as string,
        model: formData.get('new_bike_model') as string,
        year: formData.get('new_bike_year') ? Number(formData.get('new_bike_year')) : null,
        registration: (formData.get('new_bike_registration') as string) || null,
        color: (formData.get('new_bike_color') as string) || null,
      })
      .select()
      .single()
    if (bikeError) throw new Error(bikeError.message)
    bikeId = newBike.id
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      bike_id: bikeId,
      customer_id: customerId,
      customer_description: (formData.get('customer_description') as string) || null,
      damage_notes: (formData.get('damage_notes') as string) || null,
      odometer_in: formData.get('odometer_in') ? Number(formData.get('odometer_in')) : null,
      estimated_cost: formData.get('estimated_cost') ? Number(formData.get('estimated_cost')) : null,
    })
    .select()
    .single()

  if (jobError) throw new Error(jobError.message)

  revalidatePath('/jobs')
  revalidatePath('/')
  redirect(`/jobs/${job.id}`)
}

interface CreateJobParams {
  job_type?: 'service' | 'buy_sell'
  customer_id?: string
  new_customer_name?: string
  new_customer_phone?: string
  new_customer_email?: string
  bike_id?: string
  new_bike_make?: string
  new_bike_model?: string
  new_bike_year?: number | null
  new_bike_registration?: string
  new_bike_color?: string
  new_bike_vin?: string
  customer_description?: string
  damage_notes?: string
  odometer_in?: number | null
  estimated_cost?: number | null
}

export async function createJobReturnId(params: CreateJobParams): Promise<string> {
  const supabase = await createClient()

  let customerId = params.customer_id
  let bikeId = params.bike_id

  if (!customerId) {
    const { data: newCustomer, error: custError } = await supabase
      .from('customers')
      .insert({
        name: params.new_customer_name!,
        phone: params.new_customer_phone || null,
        email: params.new_customer_email || null,
      })
      .select()
      .single()
    if (custError) throw new Error(custError.message)
    customerId = newCustomer.id
  }

  if (!bikeId) {
    const { data: newBike, error: bikeError } = await supabase
      .from('bikes')
      .insert({
        customer_id: customerId,
        make: normaliseName(params.new_bike_make!),
        model: normaliseName(params.new_bike_model!),
        year: params.new_bike_year || null,
        registration: params.new_bike_registration || null,
        color: params.new_bike_color || null,
        vin: params.new_bike_vin || null,
      })
      .select()
      .single()
    if (bikeError) throw new Error(bikeError.message)
    bikeId = newBike.id
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      job_type: params.job_type || 'service',
      bike_id: bikeId,
      customer_id: customerId,
      customer_description: params.customer_description || null,
      damage_notes: params.damage_notes || null,
      odometer_in: params.odometer_in || null,
      estimated_cost: params.estimated_cost || null,
    })
    .select()
    .single()

  if (jobError) throw new Error(jobError.message)

  revalidatePath('/jobs')
  revalidatePath('/')
  return job.id
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'checked_out') {
    updateData.check_out_date = new Date().toISOString()
  }

  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)

  if (error) throw new Error(error.message)

  if (status === 'ready') {
    const { data: job } = await supabase
      .from('jobs')
      .select('job_number, customer:customers(name), bike:bikes(make, model, year)')
      .eq('id', jobId)
      .single()

    if (job) {
      const customerName = (job.customer as unknown as { name: string } | null)?.name ?? 'Customer'
      const bike = job.bike as unknown as { make: string; model: string; year: number | null } | null
      const bikeDesc = bike ? `${bike.year ? bike.year + ' ' : ''}${bike.make} ${bike.model}` : 'bike'
      await sendPushToAll({
        title: "🏍️ Bike Ready for Collection",
        body: `${customerName}'s ${bikeDesc} is ready — Job #${job.job_number}`,
        url: `/jobs/${jobId}`,
      }).catch(() => {})
    }
  }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/jobs')
  revalidatePath('/')
}

export async function updateJobNotes(jobId: string, formData: FormData) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    work_performed: (formData.get('work_performed') as string) || null,
    damage_notes: (formData.get('damage_notes') as string) || null,
    parts_cost: formData.get('parts_cost') ? Number(formData.get('parts_cost')) : null,
    labour_cost: formData.get('labour_cost') ? Number(formData.get('labour_cost')) : null,
    tax_rate: formData.get('tax_rate') ? Number(formData.get('tax_rate')) : 15,
    final_cost: formData.get('final_cost') ? Number(formData.get('final_cost')) : null,
    odometer_out: formData.get('odometer_out') ? Number(formData.get('odometer_out')) : null,
    customer_acknowledged: formData.get('customer_acknowledged') === 'on',
  }

  // For buy & sell jobs, also update the bought-for price
  const estimatedCostStr = formData.get('estimated_cost') as string
  if (estimatedCostStr && !isNaN(Number(estimatedCostStr)) && estimatedCostStr !== '') {
    updateData.estimated_cost = Number(estimatedCostStr)
  }

  const { error } = await supabase.from('jobs').update(updateData).eq('id', jobId)
  if (error) throw new Error(error.message)

  revalidatePath(`/jobs/${jobId}`)
}

export async function deletePhoto(photoId: string, storagePath: string, jobId: string) {
  const supabase = await createClient()

  await supabase.storage.from('job-photos').remove([storagePath])

  const { error } = await supabase
    .from('job_photos')
    .delete()
    .eq('id', photoId)

  if (error) throw new Error(error.message)

  revalidatePath(`/jobs/${jobId}`)
}
