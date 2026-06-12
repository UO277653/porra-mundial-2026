import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useStore } from '../lib/store'
import { hasStarted, isFinished, isLive } from '../lib/scoring'
import MatchCard from './MatchCard'

const dayFmt = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const FILTERS = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'live', label: 'En juego' },
  { key: 'finished', label: 'Jugados' },
]

export default function Matches() {
  const { matches } = useStore()
  const [filter, setFilter] = useState('upcoming')

  const liveCount = matches.filter(isLive).length

  const visible = useMemo(() => {
    const withTeams = matches.filter((m) => m.home_team && m.away_team)
    if (filter === 'live') return withTeams.filter(isLive)
    if (filter === 'finished')
      return withTeams.filter(isFinished).sort((a, b) => new Date(b.utc_date) - new Date(a.utc_date))
    return withTeams
      .filter((m) => !hasStarted(m))
      .sort((a, b) => new Date(a.utc_date) - new Date(b.utc_date))
  }, [matches, filter])

  // Agrupar por día
  const byDay = useMemo(() => {
    const map = new Map()
    for (const m of visible) {
      const key = dayFmt.format(new Date(m.utc_date))
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(m)
    }
    return [...map.entries()]
  }, [visible])

  return (
    <section aria-label="Partidos">
      <div className="mb-5 flex gap-1 rounded-2xl bg-white p-1 shadow-sm" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 cursor-pointer rounded-xl py-2.5 font-display text-base font-semibold uppercase tracking-wide transition-colors sm:text-lg ${
              filter === f.key
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-slate-500 hover:bg-muted'
            }`}
          >
            {f.label}
            {f.key === 'live' && liveCount > 0 && (
              <span className="ml-1.5 inline-block size-2 animate-pulse rounded-full bg-red-500 align-middle" aria-label={`${liveCount} en directo`} />
            )}
          </button>
        ))}
      </div>

      {byDay.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border-soft bg-white/60 p-10 text-center text-slate-500">
          <CalendarDays aria-hidden="true" className="mx-auto mb-3 size-10 text-slate-300" />
          {filter === 'live'
            ? 'Ahora mismo no hay ningún partido en juego.'
            : filter === 'finished'
              ? 'Todavía no se ha jugado ningún partido.'
              : 'No hay próximos partidos a la vista. Los cruces aparecerán aquí cuando se conozcan.'}
        </div>
      )}

      <div className="space-y-6">
        {byDay.map(([day, dayMatches]) => (
          <div key={day}>
            <h3 className="mb-3 font-display text-xl font-bold uppercase tracking-wide text-slate-500">
              {day}
            </h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {dayMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
