'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CallNote = {
  id: string
  job_id: string
  note: string
  created_at: string
}

export async function addCallNote(jobId: string, note: string): Promise<CallNote> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('call_log')
    .insert({ job_id: jobId, note })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}`)
  return data as CallNote
}

export async function deleteCallNote(noteId: string, jobId: string) {
  const supabase = await createClient()
  await supabase.from('call_log').delete().eq('id', noteId)
  revalidatePath(`/jobs/${jobId}`)
}
