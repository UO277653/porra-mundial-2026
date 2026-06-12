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
      className={`cursor-pointer rounded-lg px-4 py-1.5 font-display text-base font-semibold uppercase tracking-wide transition-colors ${
        mode === m
          ? 'bg-primary text-on-primary shadow-sm'
          : 'text-slate-500 hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="animate-rise mx-auto w-full max-w-3xl rounded-2xl border-2 border-border-soft bg-white p-4 shadow-lg shadow-blue-100 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
          ¿Quién apuesta?
          <span className="ml-3 hidden text-sm font-normal normal-case tracking-normal text-slate-400 lg:inline">
            Tu nombre + un PIN para que nadie apueste por ti
          </span>
        </h2>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
          {tab('login', 'Entrar')}
          {tab('register', 'Crear cuenta')}
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row md:items-end" noValidate>
        <div className="min-w-0 flex-1">
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
            className="w-full rounded-xl border-2 border-border-soft bg-muted px-4 py-2.5 text-base outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>
        <div className="md:w-44">
          <label htmlFor="login-pin" className="mb-1 block text-sm font-semibold text-slate-700">
            PIN (4-6 dígitos)
          </label>
          <div className="relative">
            <KeyRound aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
            <input
              id="login-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full rounded-xl border-2 border-border-soft bg-muted py-2.5 pl-11 pr-3 text-base tracking-[0.3em] outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-display text-lg font-bold uppercase tracking-wide text-white shadow-md shadow-amber-200 transition-all hover:bg-accent-dark active:scale-[0.98] disabled:opacity-50"
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

      {mode === 'register' && !error && (
        <p className="mt-2 text-xs text-slate-500">
          Invéntate un PIN fácil de recordar: lo necesitarás para entrar.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
