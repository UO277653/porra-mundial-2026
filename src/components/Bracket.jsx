import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { useStore } from '../lib/store'
import { STAGES } from '../lib/config'
import { isFinished, isLive } from '../lib/scoring'

const dateFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function BracketTeam({ name, crest, score, winner }) {
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-1.5 ${winner ? 'font-bold text-foreground' : 'text-slate-600'}`}>
      <span className="flex min-w-0 items-center gap-2">
        {crest ? (
          <img src={crest} alt="" width="24" height="18" loading="lazy" className="h-4 w-5.5 shrink-0 rounded-[2px] object-cover" />
        ) : (
          <span aria-hidden="true" className="h-4 w-5.5 shrink-0 rounded-[2px] bg-slate-200" />
        )}
        <span className="truncate text-sm">{name || 'Por decidir'}</span>
      </span>
      {score != null && <span className="font-display text-base font-bold tabular-nums">{score}</span>}
    </div>
  )
}

export default function Bracket() {
  const { matches } = useStore()

  const columns = useMemo(() => {
    return STAGES.filter((s) => s.knockout).map((stage) => ({
      ...stage,
      matches: matches
        .filter((m) => m.stage === stage.code)
        .sort((a, b) => new Date(a.utc_date) - new Date(b.utc_date)),
    })).filter((c) => c.matches.length > 0)
  }, [matches])

  if (columns.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border-soft bg-white/60 p-10 text-center text-slate-500">
        <Trophy aria-hidden="true" className="mx-auto mb-3 size-10 text-slate-300" />
        El cuadro de eliminatorias aparecerá cuando acabe la fase de grupos.
        Los cruces se rellenan solos según avance el torneo.
      </div>
    )
  }

  return (
    <section aria-label="Cuadro de eliminatorias">
      <p className="mb-4 text-sm text-slate-500 lg:hidden">Desliza para ver todas las rondas →</p>
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex min-w-max items-stretch gap-6">
          {columns.map((col) => (
            <div key={col.code} className="flex w-60 flex-col">
              <h3 className={`mb-3 rounded-xl px-3 py-2 text-center font-display text-lg font-bold uppercase tracking-wide ${
                col.code === 'FINAL' ? 'bg-accent text-white shadow-md shadow-amber-200' : 'bg-secondary/10 text-secondary'
              }`}>
                {col.label}
              </h3>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {col.matches.map((m) => {
                  const finished = isFinished(m)
                  const live = isLive(m)
                  return (
                    <div
                      key={m.id}
                      className={`animate-rise divide-y divide-border-soft rounded-xl border-2 bg-white shadow-sm ${
                        live ? 'border-red-300' : 'border-border-soft'
                      }`}
                    >
                      <BracketTeam
                        name={m.home_team}
                        crest={m.home_crest}
                        score={m.home_score}
                        winner={finished && m.winner === 'HOME_TEAM'}
                      />
                      <BracketTeam
                        name={m.away_team}
                        crest={m.away_crest}
                        score={m.away_score}
                        winner={finished && m.winner === 'AWAY_TEAM'}
                      />
                      <div className="px-3 py-1 text-xs font-medium text-slate-400">
                        {live ? (
                          <span className="font-semibold text-danger">● En directo</span>
                        ) : finished ? (
                          'Finalizado'
                        ) : (
                          dateFmt.format(new Date(m.utc_date))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
