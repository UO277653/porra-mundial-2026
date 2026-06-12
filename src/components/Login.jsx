import { useState } from 'react'
import { KeyRound, LogIn, UserPlus, Loader2 } from 'lucide-react'
import { useStore } from '../lib/store'

export default function Login() {
  const { login, register } = useStore()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError('Pon un nombre de al menos 2 letras.')
    if (!/^\d{4,6}$/.test(pin)) return setError('El PIN son 4 a 6 dígitos.')
    setBusy(true)
    try {
      await (mode === 'login' ? login(name, pin) : register(name, pin))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const tab = (m, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => { setMode(m); setError(null) }}
      className={`flex-1 rounded-xl py-2.5 font-display text-lg font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
        mode === m
          ? 'bg-primary text-on-primary shadow-md'
          : 'text-slate-500 hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="animate-rise mx-auto w-full max-w-sm rounded-3xl border-2 border-border-soft bg-white p-6 shadow-xl shadow-blue-100">
      <div className="mb-5 text-center">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
          ¿Quién apuesta?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Tu nombre + un PIN para que nadie apueste por ti.
        </p>
      </div>

      <div className="mb-5 flex gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
        {tab('login', 'Entrar')}
        {tab('register', 'Crear cuenta')}
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-name" className="mb-1 block text-sm font-semibold text-slate-700">
            Tu nombre
          </label>
          <input
            id="login-name"
            type="text"
            autoComplete="username"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p. ej. Adrián"
            className="w-full rounded-xl border-2 border-border-soft bg-muted px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="login-pin" className="mb-1 block text-sm font-semibold text-slate-700">
            PIN (4-6 dígitos)
          </label>
          <div className="relative">
            <KeyRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              id="login-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full rounded-xl border-2 border-border-soft bg-muted py-3 pl-12 pr-4 text-base tracking-[0.4em] outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>
          {mode === 'register' && (
            <p className="mt-1 text-xs text-slate-500">
              Invéntate uno fácil de recordar: lo necesitarás para entrar.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-display text-xl font-bold uppercase tracking-wide text-white shadow-lg shadow-amber-200 transition-all hover:bg-accent-dark active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : mode === 'login' ? (
            <LogIn aria-hidden="true" className="size-5" />
          ) : (
            <UserPlus aria-hidden="true" className="size-5" />
          )}
          {mode === 'login' ? 'A jugar' : 'Crear y entrar'}
        </button>
      </form>
    </div>
  )
}
