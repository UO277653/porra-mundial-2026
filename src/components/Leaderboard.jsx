import { Crown, Medal, Target } from 'lucide-react'
import { useStore } from '../lib/store'

// Podio estilo Kahoot: 2º - 1º - 3º con alturas distintas
function Podium({ top }) {
  const [first, second, third] = [top[0], top[1], top[2]]
  const blocks = [
    { row: second, place: 2, height: 'h-28', color: 'bg-silver', text: 'text-slate-600' },
    { row: first, place: 1, height: 'h-40', color: 'bg-gold', text: 'text-amber-700' },
    { row: third, place: 3, height: 'h-20', color: 'bg-bronze', text: 'text-orange-100' },
  ]

  return (
    <div className="mx-auto flex max-w-lg items-end justify-center gap-2 px-2 sm:gap-3" aria-label="Podio">
      {blocks.map(({ row, place, height, color, text }) => (
        <div key={place} className="flex w-1/3 flex-col items-center">
          {row ? (
            <div className="animate-rise mb-2 flex flex-col items-center" style={{ animationDelay: `${place * 120}ms` }}>
              {place === 1 && (
                <Crown aria-hidden="true" className="mb-1 size-7 text-accent drop-shadow-sm" />
              )}
              <span
                className={`max-w-full truncate font-display text-xl font-bold sm:text-2xl ${
                  place === 1 ? 'gold-shine' : 'text-foreground'
                }`}
              >
                {row.player.name}
              </span>
              <span className="text-sm font-semibold text-slate-500 tabular-nums">
                {row.points} pts
              </span>
            </div>
          ) : (
            <span className="mb-2 text-sm text-slate-400">—</span>
          )}
          <div
            className={`${height} ${color} flex w-full items-start justify-center rounded-t-2xl pt-2 shadow-inner`}
          >
            <span className={`font-display text-4xl font-bold ${text}`}>{place}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Leaderboard() {
  const { leaderboard, session } = useStore()

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border-soft bg-white/60 p-10 text-center text-slate-500">
        <Medal aria-hidden="true" className="mx-auto mb-3 size-10 text-slate-300" />
        Aún no hay nadie en la porra. ¡Sé el primero en registrarte!
      </div>
    )
  }

  return (
    <section aria-label="Clasificación">
      <Podium top={leaderboard.slice(0, 3)} />

      <div className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border-2 border-border-soft bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft bg-muted text-xs uppercase tracking-wider text-slate-400">
              <th scope="col" className="w-12 px-4 py-3 text-left font-semibold">#</th>
              <th scope="col" className="px-2 py-3 text-left font-semibold">Jugador</th>
              <th scope="col" className="px-2 py-3 text-center font-semibold">
                <span className="inline-flex items-center gap-1"><Target aria-hidden="true" className="size-3.5" />Aciertos</span>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, i) => {
              const me = session && row.player.id === session.id
              return (
                <tr
                  key={row.player.id}
                  className={`lb-row border-b border-border-soft last:border-0 ${
                    me ? 'bg-blue-50/80' : i % 2 ? 'bg-muted/40' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {i < 3 ? (
                      <Medal
                        aria-label={`Puesto ${i + 1}`}
                        className={`size-5 ${i === 0 ? 'text-gold' : i === 1 ? 'text-silver' : 'text-bronze'}`}
                      />
                    ) : (
                      <span className="font-semibold text-slate-400 tabular-nums">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 font-semibold text-foreground">
                    {row.player.name}
                    {me && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-on-primary">Tú</span>}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums text-slate-500">
                    {row.hits}/{row.played}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-xl font-bold tabular-nums text-foreground">
                    {row.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-slate-400">
        1 punto por acierto en fase de grupos · 2 puntos en eliminatorias.
        La clasificación se actualiza sola en cuanto acaba cada partido.
      </p>
    </section>
  )
}
