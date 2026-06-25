'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task } from '@/lib/types'

export type DueTask = {
  id: string
  title: string
  due_date: string
  completed: boolean
  job: {
    id: string
    job_number: number
    bike: { make: string; model: string; year: number | null } | null
    customer: { name: string } | null
  } | null
}

export async function getDueTasks(): Promise<DueTask[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('tasks')
    .select('id, title, due_date, completed, job:jobs(id, job_number, bike:bikes(make, model, year), customer:customers(name))')
    .eq('completed', false)
    .lte('due_date', today)
    .order('due_date', { ascending: true })
    .limit(25)
  return (data as unknown as DueTask[]) || []
}

export async function createTask({
  jobId,
  title,
  due_date,
}: {
  jobId: string
  title: string
  due_date: string | null
}): Promise<Task> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ job_id: jobId, title, due_date })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/')
  return data
}

export async function toggleTask(taskId: string, completed: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').update({ completed }).eq('id', taskId)
  if (error) throw new Error(error.message)
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw new Error(error.message)
}
