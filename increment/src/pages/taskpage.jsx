import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

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

function SlideTaskCard({ task, onComplete }) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragXRef = useRef(0)

  const maxDrag = 140
  const completeThreshold = 55

  useEffect(() => {
    setDragX(0)
    dragXRef.current = 0
  }, [task.completed])

  const handlePointerDown = (e) => {
    if (task.completed) return

    const startX = e.clientX
    const initialX = dragXRef.current
    setDragging(true)

    e.currentTarget.setPointerCapture?.(e.pointerId)

    const onMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const nextX = Math.max(0, Math.min(maxDrag, initialX + delta))
      dragXRef.current = nextX
      setDragX(nextX)
    }

    const onUp = () => {
      setDragging(false)

      const finalX = dragXRef.current
      dragXRef.current = 0
      setDragX(0)

      if (finalX >= completeThreshold) {
        onComplete(task)
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return (
    <div
      className="relative mx-auto"
      style={{ width: '100%', maxWidth: '460px' }}
    >
      <div
        onPointerDown={handlePointerDown}
        className="cursor-grab active:cursor-grabbing transition-all duration-200"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          background: 'transparent',
          boxShadow: 'none',
          border: 'none',
        }}
      >
        <div className="flex h-full items-center justify-start px-3 sm:px-4">
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

<button onClick={enableNotifications}>
  Enable 8 AM reminders
</button>

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

async function enableNotifications() {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('This browser does not support push notifications.')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.')
    }

    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    })

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      subscription: subscription.toJSON(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error

    alert('Notifications are enabled.')
  } catch (err) {
    console.error(err)
    alert(err.message || 'Could not enable notifications.')
  }
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

  async function getWorkoutDate() {
    const { data, error } = await supabase.rpc('get_workout_date')

    if (error) throw error
    return data
  }

  async function loadTodayTasks() {
    setLoading(true)
    setError('')

    try {
      const workoutDate = await getWorkoutDate()

      const { data: existingTasks, error: fetchError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', workoutDate)
        .order('completed', { ascending: true })
        .order('id', { ascending: true })

      if (fetchError) throw fetchError

      if (existingTasks && existingTasks.length > 0) {
        setTasks(existingTasks)
        return
      }

      const { data: targets, error: targetsError } = await supabase.rpc(
        'get_today_targets',
        { p_user_id: user.id }
      )

      if (targetsError) throw targetsError
      if (!targets || targets.length === 0) {
        throw new Error('Could not load target values.')
      }

      const t = targets[0]

      const rowsToInsert = [
        {
          user_id: user.id,
          task_date: t.workout_date,
          task_key: 'squats',
          task_name: 'Squats',
          target_value: t.squats,
          unit: 'reps',
          completed: false,
        },
        {
          user_id: user.id,
          task_date: t.workout_date,
          task_key: 'pushups',
          task_name: 'Push-ups',
          target_value: t.pushups,
          unit: 'reps',
          completed: false,
        },
        {
          user_id: user.id,
          task_date: t.workout_date,
          task_key: 'lunges',
          task_name: 'Lunges',
          target_value: t.lunges_each_leg,
          unit: 'reps each leg',
          completed: false,
        },
        {
          user_id: user.id,
          task_date: t.workout_date,
          task_key: 'plank',
          task_name: 'Plank',
          target_value: t.plank_seconds,
          unit: 'sec',
          completed: false,
        },
        {
          user_id: user.id,
          task_date: t.workout_date,
          task_key: 'glute_bridge',
          task_name: 'Glute bridge',
          target_value: t.glute_bridge,
          unit: 'reps',
          completed: false,
        },
        {
          user_id: user.id,
          task_date: t.workout_date,
          task_key: 'mountain_climbers',
          task_name: 'Mountain climbers',
          target_value: t.mountain_climbers_seconds,
          unit: 'sec',
          completed: false,
        },
        {
          user_id: user.id,
          task_date: t.workout_date,
          task_key: 'superman_hold',
          task_name: 'Superman hold',
          target_value: t.superman_hold_seconds,
          unit: 'sec',
          completed: false,
        },
      ]

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

      const updatedTasks = tasks
        .map((item) => (item.id === task.id ? data : item))
        .sort((a, b) => Number(a.completed) - Number(b.completed))

      setTasks(updatedTasks)

      const allCompleted = updatedTasks.every((item) => item.completed)

      if (allCompleted) {
        const { error: completeDayError } = await supabase.rpc(
          'mark_workout_day_complete',
          { p_user_id: user.id }
        )

        if (completeDayError) throw completeDayError
      }
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