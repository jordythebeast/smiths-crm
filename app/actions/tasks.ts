'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task } from '@/lib/types'

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
