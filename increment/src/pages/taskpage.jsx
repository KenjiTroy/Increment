import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatTaskLabel(task) {
  switch (task.task_key) {
    case 'squats':
      return `Squats – ${task.target_value} reps`
    case 'pushups':
      return `Push-ups – ${task.target_value} reps`
    case 'lunges':
      return `Lunges – ${task.target_value} reps each leg`
    case 'plank':
      return `Plank – ${task.target_value} sec`
    case 'glute_bridge':
      return `Glute bridge – ${task.target_value} reps`
    case 'mountain_climbers':
      return `Mountain climbers – ${task.target_value} sec`
    case 'superman_hold':
      return `Superman hold – ${task.target_value} sec`
    default:
      return `${task.task_key} – ${task.target_value}`
  }
}

const DEFAULT_TASKS = [
  { task_key: 'squats', task_name: 'Squats', target_value: 12, unit: 'reps' },
  { task_key: 'pushups', task_name: 'Push-ups', target_value: 8, unit: 'reps' },
  { task_key: 'lunges', task_name: 'Lunges', target_value: 10, unit: 'reps each leg' },
  { task_key: 'plank', task_name: 'Plank', target_value: 30, unit: 'sec' },
  { task_key: 'glute_bridge', task_name: 'Glute bridge', target_value: 12, unit: 'reps' },
  { task_key: 'mountain_climbers', task_name: 'Mountain climbers', target_value: 30, unit: 'sec' },
  { task_key: 'superman_hold', task_name: 'Superman hold', target_value: 20, unit: 'sec' },
]

function SlideTaskCard({ task, onComplete }) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)

  const maxDrag = 120
  const completeThreshold = 80

  useEffect(() => {
    setDragX(0)
  }, [task.completed])

  const handlePointerDown = (e) => {
    if (task.completed) return

    const startX = e.clientX
    const initialX = dragX
    setDragging(true)

    const onMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const nextX = Math.max(0, Math.min(maxDrag, initialX + delta))
      setDragX(nextX)
    }

    const onUp = () => {
      setDragging(false)

      if (dragX >= completeThreshold) {
        setDragX(0)
        onComplete(task)
      } else {
        setDragX(0)
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className="relative h-24 mx-auto overflow-hidden rounded-xl"
      style={{ width: '100%', maxWidth: '460px' }}
    >
      <div
        className={`absolute inset-0 rounded-xl border transition-all duration-300 ${
          task.completed
            ? 'bg-green-500/15 border-green-400/40'
            : 'bg-[#121212] border-[#3a3a3a]'
        }`}
      />

      <div
        onPointerDown={handlePointerDown}
        className={`absolute cursor-grab active:cursor-grabbing rounded-lg border p-3 sm:p-4 transition-all duration-200 ${
          task.completed ? 'inset-0' : 'inset-2'
        } ${
          task.completed
            ? 'bg-[#1b1b1b] border-[#2a2a2a] opacity-80'
            : dragging
            ? 'bg-[#181818] border-[#2a2a2a] shadow-lg'
            : 'bg-[#121212] border-[#2a2a2a]'
        }`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'none',
        }}
      >
        <div className="flex h-full items-center justify-start">
          <div className="text-left w-full">
            <p
              className={`block w-full rounded-lg border px-3 py-1 text-left text-xl sm:text-2xl ${
                task.completed
                  ? 'text-gray-500 border-[#3a3a3a] bg-[#1f1f1f]'
                  : 'text-gray-300 border-[#2f2f2f] bg-[#171717]'
              }`}
              style={{
                fontSize: '1.45rem',
                borderWidth: '0.5px',
                borderStyle: 'solid',
                borderColor: task.completed
                  ? 'rgba(120, 120, 120, 0.6)'
                  : 'rgba(255, 255, 255, 0.35)',
                backgroundColor: task.completed
                  ? 'rgba(40, 40, 40, 0.7)'
                  : 'rgba(22, 22, 22, 0.9)',
                borderRadius: '8px',
                padding: '16px 20px',
              }}
            >
              {formatTaskLabel(task)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage({ user, onSignOut }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadTodayTasks()
    }
  }, [user])

  async function loadTodayTasks() {
    setLoading(true)
    setError('')

    try {
      const date = todayString()

      const { data: existingTasks, error: fetchError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', date)
        .order('completed', { ascending: true })
        .order('id', { ascending: true })

      if (fetchError) throw fetchError

      if (existingTasks && existingTasks.length > 0) {
        setTasks(existingTasks)
        return
      }

      const rowsToInsert = DEFAULT_TASKS.map((task) => ({
        user_id: user.id,
        task_date: date,
        task_key: task.task_key,
        task_name: task.task_name,
        target_value: task.target_value,
        unit: task.unit,
        completed: false,
      }))

      const { data: inserted, error: insertError } = await supabase
        .from('daily_tasks')
        .insert(rowsToInsert)
        .select()

      if (insertError) throw insertError

      setTasks(inserted)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(task) {
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .update({ completed: true })
        .eq('id', task.id)
        .select()
        .single()

      if (error) throw error

      setTasks((prev) => {
        const updated = prev.map((item) => (item.id === task.id ? data : item))
        return updated.sort((a, b) => Number(a.completed) - Number(b.completed))
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to complete task.')
    }
  }

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed))
  }, [tasks])

  return (
    <div
      className="min-h-screen bg-black text-white px-4 pt-14 pb-6 sm:px-6"
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
            }}
          >
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{ margin: '0 0 10px 0', paddingTop: '12px', gridColumn: 2, justifySelf: 'center' }}
            >
              Your Tasks
            </h1>
            <button
              onClick={onSignOut}
              className="rounded-full border border-[#2a2a2a] bg-[#121212] px-3 py-1 text-sm font-semibold"
              style={{ gridColumn: 3, justifySelf: 'end' }}
            >
              Sign out
            </button>
          </div>
          <p className="text-gray-400 break-all" style={{ marginTop: '8px', textAlign: 'center' }}>
            Welcome, {user.email}
          </p>
        </div>

        {loading && <p className="text-center text-gray-400">Loading tasks...</p>}
        {error && <p className="text-center text-red-400 mb-4">{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sortedTasks.map((task) => (
            <SlideTaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
            />
          ))}
        </div>
      </div>
    </div>
  )
}