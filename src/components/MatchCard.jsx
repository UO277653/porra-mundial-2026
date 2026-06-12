import { useState } from 'react'
import { Lock, CheckCircle2, XCircle, Radio } from 'lucide-react'
import { useStore } from '../lib/store'
import { isBettable, isLive, isFinished, hasStarted, matchOutcome, pointsForMatch } from '../lib/scoring'
import { stageInfo, isKnockout } from '../lib/config'

const timeFmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })

function Team({ name, crest, align = 'left' }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {crest ? (
        <img src={crest} alt="" width="32" height="24" loading="lazy" className="h-6 w-8 shrink-0 rounded-sm object-cover shadow-sm" />
      ) : (
        <span aria-hidden="true" className="h-6 w-8 shrink-0 rounded-sm bg-slate-200" />
      )}
      <span className="truncate font-semibold text-foreground">{name || 'Por decidir'}</span>
    </div>
  )
}

export default function MatchCard({ match }) {
  const { session, myBets, bets, players, placeBet } = useStore()
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)

  const knockout = isKnockout(match.stage)
  const bettable = isBettable(match)
  const started = hasStarted(match)
  const live = isLive(match)
  const finished = isFinished(match)
  const myPick = myBets.get(match.id)
  const outcome = matchOutcome(match)
  const playerName = new Map(players.map((p) => [p.id, p.name]))

  // Picks del resto (solo visibles cuando el partido ya ha empezado)
  const revealed = started
    ? bets.filter((b) => b.match_id === match.id && b.pick)
    : []

  const pick = async (value) => {
    setError(null)
    setPending(value)
    try {
      await placeBet(match.id, value)
    } catch (e) {
      setError(e.message)
    } finally {
      setPending(null)
    }
  }

  const options = knockout
    ? [
        { value: '1', label: 'Pasa', team: match.home_team },
        { value: '2', label: 'Pasa', team: match.away_team },
      ]
    : [
        { value: '1', label: '1', hint: 'Gana ' + (match.home_team || 'local') },
        { value: 'X', label: 'X', hint: 'Empate' },
        { value: '2', label: '2', hint: 'Gana ' + (match.away_team || 'visitante') },
      ]

  return (
    <article className="animate-rise rounded-2xl border-2 border-border-soft bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Cabecera: fase + estado */}
      <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider">
        <span className="text-slate-400">
          {stageInfo(match.stage).label}
          {match.group_name ? ` · ${match.group_name}` : ''}
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-danger">
            <Radio aria-hidden="true" className="size-3.5 animate-pulse" /> En directo
          </span>
        ) : finished ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">Final</span>
        ) : (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-primary">
            {timeFmt.format(new Date(match.utc_date))} h
          </span>
        )}
      </div>

      {/* Equipos y marcador */}
      <div className="flex items-center gap-3">
        <Team name={match.home_team} crest={match.home_crest} />
        <div className="shrink-0 text-center">
          {started && match.home_score != null ? (
            <span className={`font-display text-3xl font-bold tabular-nums ${live ? 'text-danger' : 'text-foreground'}`}>
              {match.home_score} - {match.away_score}
            </span>
          ) : (
            <span className="font-display text-2xl font-semibold text-slate-300">vs</span>
          )}
        </div>
        <Team name={match.away_team} crest={match.away_crest} align="right" />
      </div>

      {/* Botonera 1X2 o estado de la apuesta */}
      {bettable && session && (
        <div className={`mt-4 grid gap-2 ${knockout ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {options.map((opt) => {
            const active = myPick === opt.value
            const busy = pending === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => pick(opt.value)}
                disabled={pending !== null}
                title={opt.hint || `Pasa ${opt.team}`}
                aria-pressed={active}
                className={`cursor-pointer rounded-xl border-2 py-2.5 font-display text-lg font-bold uppercase transition-all active:scale-95 disabled:opacity-60 ${
                  active
                    ? 'border-primary bg-primary text-on-primary shadow-md shadow-blue-200'
                    : 'border-border-soft bg-muted text-slate-600 hover:border-primary hover:text-primary'
                } ${busy ? 'animate-pulse' : ''}`}
              >
                {knockout ? (
                  <span className="block truncate px-1 text-base">{opt.team || '—'}</span>
                ) : (
                  opt.label
                )}
              </button>
            )
          })}
        </div>
      )}

      {bettable && !session && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-slate-500">
          <Lock aria-hidden="true" className="size-4" /> Entra con tu nombre para apostar
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>
      )}

      {/* Una vez empieza: tu resultado + picks de todos */}
      {started && (
        <div className="mt-4 space-y-2 border-t border-border-soft pt-3">
          {myPick && (
            <div className="flex items-center gap-2 text-sm font-semibold">
              {finished ? (
                myPick === outcome ? (
                  <span className="flex items-center gap-1.5 text-pitch">
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    ¡Acertaste! +{pointsForMatch(match)} {pointsForMatch(match) === 1 ? 'punto' : 'puntos'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <XCircle aria-hidden="true" className="size-4" /> Esta vez no ({pickLabel(myPick, match, knockout)})
                  </span>
                )
              ) : (
                <span className="text-primary">Tu apuesta: {pickLabel(myPick, match, knockout)}</span>
              )}
            </div>
          )}
          {revealed.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Apuestas de los jugadores">
              {revealed.map((b) => {
                const hit = finished && b.pick === outcome
                return (
                  <li
                    key={b.player_id}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      hit ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {playerName.get(b.player_id) || '¿?'} · {pickLabel(b.pick, match, knockout)}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}

function pickLabel(pick, match, knockout) {
  if (!knockout) return pick
  if (pick === '1') return match.home_team || 'Local'
  if (pick === '2') return match.away_team || 'Visitante'
  return pick
}
