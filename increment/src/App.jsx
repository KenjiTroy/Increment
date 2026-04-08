import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import TasksPage from './pages/taskpage'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

 const signInWithGoogle = async () => {
  console.log('Signing in from:', window.location.origin)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      scopes: 'https://www.googleapis.com/auth/userinfo.email',
    },
  })

  console.log('signInWithOAuth:', data, error)
}

  const signOut = async () => {
    await supabase.auth.signOut()
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="14"
              height="14"
              style={{ flexShrink: 0 }}
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.244 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.955 3.045l5.657-5.657C34.053 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.955 3.045l5.657-5.657C34.053 6.053 29.277 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.17 35.091 26.715 36 24 36c-5.223 0-9.618-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.793 2.41-2.342 4.457-4.387 5.57l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-[#2a2a2a] flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Secure login
            </span>
            <div className="h-px bg-[#2a2a2a] flex-1" />
          </div>

          <p className="text-center text-sm text-gray-400">
            By continuing, you agree to use Increment with your Google
            account.
          </p>
        </div>
      </div>
    </div>
  )
}