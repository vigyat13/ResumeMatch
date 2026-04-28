'use client'

/**
 * AUTH MODAL
 *
 * Appears when user clicks "Download PDF" without being signed in.
 *
 * WHY gate auth at download, not at entry?
 * "Builder-first, auth-last" is the proven conversion pattern:
 *  1. User builds value (fills in their resume) → emotional investment
 *  2. They want to keep what they built → motivation to sign up
 *  3. Auth at entry has ~50% drop-off; auth-at-download has ~80% conversion
 *
 * After successful auth, calls onSuccess() which triggers save + print.
 */

import { useState } from 'react'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onSuccess: () => void
  onClose:   () => void
}

export function AuthModal({ onSuccess, onClose }: Props) {
  const [mode, setMode]           = useState<'login' | 'signup'>('signup')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [oauthLoading, setOauth]  = useState<'google' | 'github' | null>(null)
  const [error, setError]         = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Signup failed'); return }
      } else {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Login failed'); return }
      }
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauth(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}` },
    })
    if (error) { setError(error.message); setOauth(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface-raised)] rounded-2xl shadow-2xl w-full max-w-md p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {mode === 'signup' ? 'Create a free account to download' : 'Sign in to download'}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Your resume will be saved to your account automatically.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" placeholder="First name" required value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
              />
              <input
                type="text" placeholder="Last name" required value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
              />
            </div>
          )}
          <input
            type="email" placeholder="Email" required value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} placeholder="Password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
            />
            <button type="button" onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold
                       hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signup' ? 'Create account & download' : 'Sign in & download'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border)]" /></div>
          <div className="relative flex justify-center"><span className="px-3 bg-[var(--color-surface-raised)] text-xs text-[var(--color-text-muted)]">or</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading}
            className="flex items-center justify-center gap-2 py-2.5 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50">
            {oauthLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )} Google
          </button>
          <button onClick={() => handleOAuth('github')} disabled={!!oauthLoading}
            className="flex items-center justify-center gap-2 py-2.5 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50">
            {oauthLoading === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
            )} GitHub
          </button>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-4">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setMode(m => m === 'signup' ? 'login' : 'signup')}
            className="text-[var(--color-accent)] font-medium hover:underline">
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  )
}
