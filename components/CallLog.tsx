'use client'

import { useState } from 'react'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { addCallNote, deleteCallNote, type CallNote } from '@/app/actions/calllog'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CallLog({ jobId, initialNotes }: { jobId: string; initialNotes: CallNote[] }) {
  const [notes, setNotes] = useState<CallNote[]>(initialNotes)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!text.trim()) return
    setLoading(true)
    try {
      const note = await addCallNote(jobId, text.trim())
      setNotes((prev) => [note, ...prev])
      setText('')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(noteId: string) {
    await deleteCallNote(noteId, jobId)
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm py-2"
          placeholder='e.g. "Dave called — collecting Thursday afternoon"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
        />
        <button
          onClick={handleAdd}
          disabled={loading || !text.trim()}
          className="btn-primary px-3 py-2 shrink-0 disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
          <MessageSquare size={14} />
          <span>No notes yet — type above and press Enter</span>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-2 group">
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-sm text-gray-800">{note.note}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(note.created_at)}</p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all mt-2 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
