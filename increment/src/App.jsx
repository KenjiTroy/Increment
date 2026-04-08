import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import TasksPage from './pages/taskpage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      console.log('Current URL:', window.location.href)

      const { data, error } = await supabase.auth.getSession()
      console.log('getSession result:', data, error)

      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      console.log('Session from event:', session)

      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    console.log('Signing in from:', window.location.origin)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    console.log('signInWithOAuth:', data, error)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="text-white bg-black min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (user) {
    return <TasksPage user={user} onSignOut={signOut} />
  }

  return (
    <div className="text-white bg-black min-h-screen flex items-center justify-center">
      <button onClick={signInWithGoogle}>Continue with Google</button>
    </div>
  )
}