'use client'

import { useState } from 'react'
import { Loader2, Check, User, Shield, Bell, CreditCard, Crown, Sparkles } from 'lucide-react'

type Tab = 'profile' | 'security' | 'notifications' | 'billing'

interface Profile {
  first_name:        string
  last_name:         string
  email:             string
  avatar_url:        string | null
  timezone:          string | null
  subscription_tier: string
}
interface Prefs {
  ats_tips:                      boolean | null
  real_time_alerts:              boolean | null
  marketing_emails:              boolean | null
  billing_emails:                boolean | null
  job_alerts_frequency:          string | null
  application_updates_frequency: string | null
}

interface Props {
  profile: Profile
  prefs:   Prefs | null
}

export function SettingsClient({ profile: initialProfile, prefs: initialPrefs }: Props) {
  const [tab, setTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',       label: 'Profile',       icon: User       },
    { id: 'security',      label: 'Security',      icon: Shield      },
    { id: 'notifications', label: 'Notifications', icon: Bell        },
    { id: 'billing',       label: 'Billing',       icon: CreditCard  },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-[var(--color-text-muted)] mt-1 text-sm">Manage your account and preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile'       && <ProfileTab       profile={initialProfile} />}
      {tab === 'security'      && <SecurityTab />}
      {tab === 'notifications' && <NotificationsTab prefs={initialPrefs} />}
      {tab === 'billing'       && <BillingTab       tier={initialProfile.subscription_tier} />}
    </div>
  )
}

/* ── Profile Tab ─────────────────────────────────────────── */

function ProfileTab({ profile }: { profile: Profile }) {
  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName,  setLastName]  = useState(profile.last_name)
  const [timezone,  setTimezone]  = useState(profile.timezone ?? '')
  const [saving,    setSaving]    = useState(false)
  const [status,    setStatus]    = useState<'idle' | 'ok' | 'err'>('idle')
  const [errMsg,    setErrMsg]    = useState('')

  const initials = `${(firstName[0] ?? '').toUpperCase()}${(lastName[0] ?? '').toUpperCase()}` || '?'

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setStatus('idle')
    const res  = await fetch('/api/v1/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ first_name: firstName, last_name: lastName, timezone: timezone || undefined }),
    })
    const body = await res.json()
    setSaving(false)
    if (res.ok) { setStatus('ok') }
    else        { setStatus('err'); setErrMsg(body.error ?? 'Failed to save.') }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            : <span className="text-xl font-bold text-white">{initials}</span>
          }
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{profile.first_name} {profile.last_name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name">
          <input value={firstName} onChange={e => setFirstName(e.target.value)}
            className={inputCls} placeholder="First name" required />
        </Field>
        <Field label="Last Name">
          <input value={lastName} onChange={e => setLastName(e.target.value)}
            className={inputCls} placeholder="Last name" />
        </Field>
      </div>

      <Field label="Email" hint="Managed by your sign-in provider.">
        <input value={profile.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
      </Field>

      <Field label="Timezone">
        <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
          <option value="">— Select timezone —</option>
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
        </select>
      </Field>

      {status === 'err' && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">{errMsg}</p>}

      <SaveButton saving={saving} ok={status === 'ok'} />
    </form>
  )
}

/* ── Security Tab ────────────────────────────────────────── */

function SecurityTab() {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [status,    setStatus]    = useState<'idle' | 'ok' | 'err'>('idle')
  const [errMsg,    setErrMsg]    = useState('')

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirm) { setStatus('err'); setErrMsg('Passwords do not match.'); return }
    setSaving(true); setStatus('idle')
    const res  = await fetch('/api/v1/auth/password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    })
    const body = await res.json()
    setSaving(false)
    if (res.ok) { setStatus('ok'); setPassword(''); setConfirm('') }
    else        { setStatus('err'); setErrMsg(body.error ?? 'Failed to update password.') }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Change Password</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Choose a strong password of at least 8 characters. If you signed in with Google or GitHub, set a password to enable email login too.
        </p>
        <div className="space-y-4">
          <Field label="New Password">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className={inputCls} placeholder="At least 8 characters" required minLength={8} />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className={inputCls} placeholder="Repeat new password" required />
          </Field>
        </div>
      </div>

      {status === 'err' && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">{errMsg}</p>}
      <SaveButton saving={saving} ok={status === 'ok'} label="Update Password" />
    </form>
  )
}

/* ── Notifications Tab ───────────────────────────────────── */

function NotificationsTab({ prefs: initial }: { prefs: Prefs | null }) {
  const [ats,      setAts]      = useState(initial?.ats_tips          ?? true)
  const [realtime, setRealtime] = useState(initial?.real_time_alerts  ?? true)
  const [marketing,setMarketing]= useState(initial?.marketing_emails  ?? false)
  const [billing,  setBilling]  = useState(initial?.billing_emails    ?? true)
  const [jobFreq,  setJobFreq]  = useState(initial?.job_alerts_frequency ?? 'weekly')
  const [saving,   setSaving]   = useState(false)
  const [status,   setStatus]   = useState<'idle' | 'ok' | 'err'>('idle')

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setStatus('idle')
    const res = await fetch('/api/v1/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ats_tips: ats, real_time_alerts: realtime, marketing_emails: marketing, billing_emails: billing, job_alerts_frequency: jobFreq }),
    })
    setSaving(false)
    setStatus(res.ok ? 'ok' : 'err')
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] divide-y divide-[var(--color-border)]">
        <Toggle label="ATS tips & resume advice" desc="Weekly tips to improve your ATS score and resume quality." checked={ats} onChange={setAts} />
        <Toggle label="Real-time match alerts"   desc="Notify me when a new match is found for my resume."      checked={realtime}  onChange={setRealtime} />
        <Toggle label="Marketing emails"         desc="Product updates, new templates, and feature announcements." checked={marketing} onChange={setMarketing} />
        <Toggle label="Billing & receipts"       desc="Payment confirmations and subscription updates. Always on for Pro." checked={billing} onChange={setBilling} />
      </div>

      <Field label="Job alert frequency">
        <select value={jobFreq} onChange={e => setJobFreq(e.target.value)} className={inputCls}>
          <option value="never">Never</option>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
        </select>
      </Field>

      <SaveButton saving={saving} ok={status === 'ok'} label="Save Preferences" />
    </form>
  )
}

/* ── Billing Tab ─────────────────────────────────────────── */

function BillingTab({ tier }: { tier: string }) {
  const isPro = tier === 'pro' || tier === 'enterprise'

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-0.5">Current Plan</h2>
            <div className="flex items-center gap-2 mt-1">
              {isPro
                ? <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700"><Crown className="w-3.5 h-3.5" /> Pro</span>
                : <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">Free</span>
              }
            </div>
          </div>
          {!isPro && (
            <button
              onClick={() => alert('Stripe billing coming soon!')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Crown className="w-4 h-4" /> Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      {/* Free plan limits */}
      {!isPro && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Unlock Pro</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Unlimited ATS audits',
              'Unlimited job matches',
              'Priority AI analysis',
              'Pro-only templates',
              'Export to PDF (no watermark)',
              'Email support',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">$9</span>
              <span className="text-sm text-[var(--color-text-muted)]"> / month</span>
            </div>
            <button
              onClick={() => alert('Stripe billing coming soon!')}
              className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Get Pro
            </button>
          </div>
        </div>
      )}

      {isPro && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <Check className="w-4 h-4" />
            <p className="text-sm font-medium">You have full access to all Pro features.</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Shared sub-components ───────────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-text-primary)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function SaveButton({ saving, ok, label = 'Save Changes' }: { saving: boolean; ok: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : ok     ? <><Check className="w-4 h-4" /> Saved!</>
              :           label}
    </button>
  )
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40'

const TIMEZONES = [
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Toronto','America/Vancouver','America/Sao_Paulo',
  'Europe/London','Europe/Paris','Europe/Berlin','Europe/Amsterdam',
  'Europe/Madrid','Europe/Rome','Europe/Stockholm','Europe/Zurich',
  'Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo',
  'Asia/Shanghai','Asia/Seoul','Asia/Hong_Kong',
  'Australia/Sydney','Australia/Melbourne',
  'Pacific/Auckland','UTC',
]
