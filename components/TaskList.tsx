'use client'

import { useState, useTransition, useRef } from 'react'
import { createTask, toggleTask, deleteTask, updateTaskDate } from '@/app/actions/tasks'
import { Check, Trash2, Plus, Calendar } from 'lucide-react'
import type { Task } from '@/lib/types'

interface Props {
  jobId: string
  initialTasks: Task[]
}

function isDue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function TaskDatePicker({ task, onDateChange }: { task: Task; onDateChange: (date: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const overdue = isDue(task.due_date)

  function openPicker() {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker()
      } else {
        inputRef.current.click()
      }
    }
  }

  return (
    <button
      type="button"
      onClick={openPicker}
      className={`text-xs mt-0.5 flex items-center gap-1 w-fit ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}
    >
      <Calendar size={11} className="shrink-0" />
      <span>
        {task.due_date
          ? new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
          : 'Set date'}
        {task.due_date && overdue && ' — overdue'}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={task.due_date ?? ''}
        onChange={(e) => onDateChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </button>
  )
}

export default function TaskList({ jobId, initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!newTitle.trim()) return
    startTransition(async () => {
      const task = await createTask({ jobId, title: newTitle.trim(), due_date: newDueDate || null })
      setTasks((t) => [...t, task])
      setNewTitle('')
      setNewDueDate('')
    })
  }

  function handleToggle(task: Task) {
    startTransition(async () => {
      await toggleTask(task.id, !task.completed)
      setTasks((t) => t.map((t2) => (t2.id === task.id ? { ...t2, completed: !t2.completed } : t2)))
    })
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId)
      setTasks((t) => t.filter((t2) => t2.id !== taskId))
    })
  }

  function handleDateChange(taskId: string, newDate: string) {
    const due_date = newDate || null
    setTasks((t) => t.map((t2) => t2.id === taskId ? { ...t2, due_date } : t2))
    startTransition(async () => {
      await updateTaskDate(taskId, due_date)
    })
  }

  const open = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)

  return (
    <div className="space-y-3">
      {open.map((task) => (
        <div key={task.id} className="flex items-start gap-2.5">
          <button
            onClick={() => handleToggle(task)}
            className="mt-0.5 w-5 h-5 rounded border border-gray-300 hover:border-red-400 flex items-center justify-center shrink-0 transition-colors"
          >
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{task.title}</p>
            <TaskDatePicker task={task} onDateChange={(d) => handleDateChange(task.id, d)} />
          </div>
          <button
            onClick={() => handleDelete(task.id)}
            className="text-gray-300 hover:text-red-500 transition-colors mt-0.5 shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {done.length > 0 && (
        <div className="border-t border-gray-100 pt-2 space-y-2">
          {done.map((task) => (
            <div key={task.id} className="flex items-start gap-2.5 opacity-50">
              <button
                onClick={() => handleToggle(task)}
                className="mt-0.5 w-5 h-5 rounded bg-green-600 border-green-600 border flex items-center justify-center shrink-0"
              >
                <Check size={11} className="text-white" />
              </button>
              <p className="text-sm text-gray-400 line-through flex-1">{task.title}</p>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-gray-200 hover:text-red-400 transition-colors mt-0.5 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <p className="text-sm text-gray-400">No tasks yet</p>
      )}

      {/* Add task */}
      <div className="pt-1 space-y-2">
        <input
          className="input text-sm py-2"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className="flex gap-2">
          <input
            className="input text-sm py-2 flex-1"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || isPending}
            className="btn-primary flex items-center gap-1.5 py-2 px-3 text-sm"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
