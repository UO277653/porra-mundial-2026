import { useMemo, useState } from 'react'
import { Newspaper, CheckCircle2, XCircle } from 'lucide-react'
import { useStore } from '../lib/store'
import { isFinished, matchOutcome, pointsForMatch } from '../lib/scoring'
import { stageInfo, isKnockout } from '../lib/config'

const EMOJIS = ['😂', '😭', '🔥', '👏', '💀', '🤡', '😱', '❤️']

const dateFmt = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function Reactions({ match }) {
  const { session, reactions, react, players } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const playerName = new Map(players.map((p) => [p.id, p.name]))
  const matchReactions = reactions.filter((r) => r.match_id === match.id)
  const mine = session
    ? matchReactions.find((r) => r.player_id === session.id)?.emoji
    : null

  const counts = new Map()
  for (const r of matchReactions) {
    if (!counts.has(r.emoji)) counts.set(r.emoji, [])
    counts.get(r.emoji).push(playerName.get(r.player_id) || '¿?')
  }

  const toggle = async (emoji) => {
    if (!session || busy) return
    setBusy(true)
    setError(null)
    try {
      await react(match.id, mine === emoji ? '' : emoji)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 border-t border-border-soft pt-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {EMOJIS.map((emoji) => {
          const who = counts.get(emoji) || []
          const active = mine === emoji
          // Sin sesión solo se muestran las reacciones que ya existen
          if (!session && who.length === 0) return null
          return (
            <button
              key={emoji}
              type="button"
              disabled={!session || busy}
              onClick={() => toggle(emoji)}
              aria-pressed={active}
              title={who.length ? who.join(', ') : `Reaccionar con ${emoji}`}
              className={`cursor-pointer rounded-full border-2 px-2 py-0.5 text-sm transition-all active:scale-90 disabled:cursor-default ${
                active
                  ? 'border-primary bg-blue-50'
                  : who.length
                    ? 'border-border-soft bg-muted hover:border-primary'
                    : 'border-transparent bg-transparent opacity-60 hover:opacity-100 hover:bg-muted'
              }`}
            >
              {emoji}
              {who.length > 0 && (
                <span className="ml-1 text-xs font-bold tabular-nums text-slate-600">{who.length}</span>
              )}
            </button>
          )
        })}
      </div>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}

function ActivityCard({ match }) {
  const { bets, players, session } = useStore()
  const playerName = new Map(players.map((p) => [p.id, p.name]))
  const outcome = matchOutcome(match)
  const knockout = isKnockout(match.stage)

  const placed = bets.filter((b) => b.match_id === match.id && b.pick)
  const hits = placed.filter((b) => b.pick === outcome)
  const misses = placed.filter((b) => b.pick !== outcome)
  const pts = pointsForMatch(match)

  const names = (list) =>
    list
      .map((b) => {
        const name = playerName.get(b.player_id) || '¿?'
        return session && b.player_id === session.id ? `${name} (tú)` : name
      })
      .join(', ')

  return (
    <article className="animate-rise rounded-2xl border-2 border-border-soft bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span>{stageInfo(match.stage).label}{match.group_name ? ` · ${match.group_name}` : ''}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">Final</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right font-semibold">
          <span className="truncate">{match.home_team}</span>
          {match.home_crest && (
            <img src={match.home_crest} alt="" width="32" height="24" loading="lazy" className="h-6 w-8 shrink-0 rounded-sm object-cover shadow-sm" />
          )}
        </span>
        <span className="shrink-0 font-display text-3xl font-bold tabular-nums">
          {match.home_score} - {match.away_score}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
          {match.away_crest && (
            <img src={match.away_crest} alt="" width="32" height="24" loading="lazy" className="h-6 w-8 shrink-0 rounded-sm object-cover shadow-sm" />
          )}
          <span className="truncate">{match.away_team}</span>
        </span>
      </div>
      {knockout && match.winner && match.winner !== 'DRAW' && (
        <p className="mt-1 text-center text-xs font-semibold text-slate-500">
          Pasa {match.winner === 'HOME_TEAM' ? match.home_team : match.away_team}
        </p>
      )}

      <div className="mt-3 space-y-1.5 text-sm">
        {placed.length === 0 ? (
          <p className="text-slate-400">Nadie apostó en este partido. Cobardes. 🐔</p>
        ) : (
          <>
            {hits.length > 0 && (
              <p className="flex items-start gap-1.5">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-pitch" />
                <span>
                  <strong className="text-green-700">Aciertan (+{pts}):</strong>{' '}
                  <span className="text-slate-600">{names(hits)}</span>
                </span>
              </p>
            )}
            {misses.length > 0 && (
              <p className="flex items-start gap-1.5">
                <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <span>
                  <strong className="text-slate-500">Fallan:</strong>{' '}
                  <span className="text-slate-600">{names(misses)}</span>
                </span>
              </p>
            )}
            {hits.length === 0 && (
              <p className="text-slate-500">Nadie lo vio venir. Cero aciertos. 💀</p>
            )}
          </>
        )}
      </div>

      <Reactions match={match} />
    </article>
  )
}

export default function Activity() {
  const { matches, session } = useStore()

  const finished = useMemo(
    () =>
      matches
        .filter(isFinished)
        .sort((a, b) => new Date(b.utc_date) - new Date(a.utc_date)),
    [matches],
  )

  const byDay = useMemo(() => {
    const map = new Map()
    for (const m of finished) {
      const key = dateFmt.format(new Date(m.utc_date))
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(m)
    }
    return [...map.entries()]
  }, [finished])

  if (finished.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border-soft bg-white/60 p-10 text-center text-slate-500">
        <Newspaper aria-hidden="true" className="mx-auto mb-3 size-10 text-slate-300" />
        Aquí aparecerá cada partido al acabar: quién acertó, quién falló y las reacciones.
      </div>
    )
  }

  return (
    <section aria-label="Actividad">
      {!session && (
        <p className="mb-4 rounded-xl bg-muted px-4 py-2.5 text-sm text-slate-500">
          Entra con tu nombre para poder reaccionar.
        </p>
      )}
      <div className="space-y-6">
        {byDay.map(([day, dayMatches]) => (
          <div key={day}>
            <h3 className="mb-3 font-display text-xl font-bold uppercase tracking-wide text-slate-500">
              {day}
            </h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {dayMatches.map((m) => (
                <ActivityCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
