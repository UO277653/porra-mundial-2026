import { useEffect, useState } from 'react'
import { CalendarDays, Table2, GitFork, Trophy, LogOut, Loader2, FlaskConical, Newspaper } from 'lucide-react'
import { useStore } from './lib/store'
import { isCoLeader, rankBoard } from './lib/scoring'
import Login from './components/Login'
import Matches from './components/Matches'
import Groups from './components/Groups'
import Bracket from './components/Bracket'
import Leaderboard from './components/Leaderboard'
import Activity from './components/Activity'
import ShitpostOverlay from './components/ShitpostOverlay'

const TABS = [
  { key: 'matches', label: 'Partidos', icon: CalendarDays, component: Matches },
  { key: 'activity', label: 'Actividad', icon: Newspaper, component: Activity },
  { key: 'groups', label: 'Grupos', icon: Table2, component: Groups },
  { key: 'bracket', label: 'Cuadro', icon: GitFork, component: Bracket },
  { key: 'leaderboard', label: 'Clasificación', icon: Trophy, component: Leaderboard },
]

export default function App() {
  const { session, logout, loading, error, demo, groupBoard, knockoutBoard, players, settings } = useStore()
  const [shitpost, setShitpost] = useState(false)
  // La pestaña vive en el hash de la URL (#groups, #leaderboard…) para poder compartir enlaces
  const [tab, setTabState] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return TABS.some((t) => t.key === hash) ? hash : 'matches'
  })
  const setTab = (key) => {
    setTabState(key)
    window.history.replaceState(null, '', `#${key}`)
  }
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (TABS.some((t) => t.key === hash)) setTabState(hash)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const Active = TABS.find((t) => t.key === tab).component

  // Eres rey de una fase si empatas en lo más alto (co-campeón), no solo si vas 1º
  const reigns = []
  if (session && isCoLeader(groupBoard, session.id)) reigns.push('grupos')
  if (session && isCoLeader(knockoutBoard, session.id)) reigns.push('eliminatoria')
  const groupRank = session
    ? rankBoard(groupBoard).find((r) => r.player.id === session.id)?.rank || 0
    : 0
  const titleAuthor = settings?.title_by
    ? players.find((p) => p.id === settings.title_by)?.name
    : null

  return (
    <div className="stadium-bg min-h-dvh">
      <ShitpostOverlay active={shitpost} />

      {/* Cabecera */}
      <header className={`text-white shadow-lg ${shitpost ? 'shitpost-header' : 'bg-gradient-to-r from-primary-dark via-primary to-secondary'}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:py-5">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-extrabold uppercase italic tracking-wide sm:text-4xl">
              {shitpost && <span style={{ fontSize: '0.85em' }}>🕶️ </span>}
              Porra Mundial <span className="text-accent">2026</span>
              {shitpost && <span style={{ fontSize: '0.85em' }}> 🕶️</span>}
            </h1>
            {/* Un rey puede renombrar la porra: su título sustituye al lema */}
            {settings?.title ? (
              <p className="truncate text-sm font-semibold text-amber-300">
                «{settings.title}»
                {titleAuthor && ` — por ${titleAuthor}`}
              </p>
            ) : (
              <p className="hidden text-sm text-blue-100 sm:block">
                La porra de la oficina · sin dinero, solo honor
              </p>
            )}
          </div>
          {session && (
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="max-w-32 truncate font-display text-lg font-bold leading-tight sm:max-w-none">
                  {session.name}
                </p>
                {reigns.length > 0 ? (
                  <p className="text-xs font-semibold text-amber-300">
                    👑 Rey de {reigns.join(' y ')}
                  </p>
                ) : (
                  groupRank > 0 && (
                    <p className="text-xs text-blue-100">Grupos · Nº {groupRank}</p>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={logout}
                title="Salir"
                aria-label="Cerrar sesión"
                className="cursor-pointer rounded-xl bg-white/15 p-2.5 transition-colors hover:bg-white/25"
              >
                <LogOut aria-hidden="true" className="size-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="mx-auto max-w-5xl px-4" aria-label="Secciones">
          <div className="flex items-end gap-2 pb-3">
            {/* Tabs — scroll horizontal solo en este trozo */}
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-current={tab === key ? 'page' : undefined}
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 font-display text-base font-semibold uppercase tracking-wide transition-colors sm:text-lg ${
                    tab === key
                      ? 'bg-white text-primary shadow-md'
                      : 'text-blue-100 hover:bg-white/15'
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Botón modo SHITPOST — fuera del scroll */}
            <button
              type="button"
              onClick={() => setShitpost((v) => !v)}
              title={shitpost ? 'Desactivar modo shitpost' : 'Activar modo shitpost'}
              className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 font-display text-base font-semibold uppercase tracking-wide transition-all sm:text-lg ${
                shitpost
                  ? 'bg-yellow-400 text-black shadow-lg scale-105'
                  : 'text-blue-100 hover:bg-white/15'
              }`}
            >
              {shitpost ? '💀 MODO ON' : '🥁 ?'}
            </button>
          </div>
        </nav>
      </header>

      {demo && (
        <div className="bg-accent/15 px-4 py-2 text-center text-sm font-medium text-amber-800">
          <FlaskConical aria-hidden="true" className="mr-1 inline size-4 align-text-bottom" />
          Modo demo con datos de ejemplo — configura Supabase para jugar de verdad (ver README)
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {!session && (
          <div className="mb-8">
            <Login />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
            <Loader2 aria-hidden="true" className="size-6 animate-spin" />
            Cargando la porra…
          </div>
        ) : error ? (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-danger">No se pudo cargar la porra</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 cursor-pointer rounded-xl bg-danger px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <Active />
        )}
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">
        Hecho con ⚽ para picarnos sanamente · Datos: football-data.org
      </footer>
    </div>
  )
}
