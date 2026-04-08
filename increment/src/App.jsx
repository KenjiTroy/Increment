import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import TasksPage from './pages/taskpage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) console.error(error)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) console.error('Google sign-in error:', error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (user) {
    return <TasksPage user={user} onSignOut={signOut} />
  }

  return (
    <div
      className="bg-black text-white px-4"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="mx-auto rounded-2xl"
        style={{
          width: '100%',
          maxWidth: '390px',
          backgroundColor: 'rgba(18, 18, 18, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '24px 20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
          textAlign: 'center',
        }}
      >
        <div className="flex flex-col items-center text-center">
          <h1
            className="font-bold"
            style={{
              margin: '0 0 14px 0',
              width: '100%',
              fontSize: 'clamp(2rem, 8vw, 2.5rem)',
              lineHeight: 1.08,
              textAlign: 'center',
            }}
          >
            Log in to Increment
          </h1>

          <p className="text-sm text-gray-400" style={{ margin: '0 0 22px 0' }}>
            Continue building your account with Google
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            className="mx-auto rounded-full border border-white/60 bg-white/25 py-3 px-4 font-semibold hover:border-white hover:bg-white/35 hover:scale-[1.02] transition flex items-center justify-center gap-3"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.7)',
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              borderRadius: '9999px',
              padding: '12px 16px',
              marginTop: '6px',
              marginBottom: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}