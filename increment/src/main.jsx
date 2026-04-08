import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js')
      console.log('Service worker registered')
    } catch (err) {
      console.error('Service worker registration failed', err)
    }
  })
}

useEffect(() => {
  supabase.auth.getUser().then(({ data, error }) => {
    console.log('getUser:', data, error)
    setUser(data.user ?? null)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('auth change:', event, session)
    setUser(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}, [])