import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { computeGroupTable } from '../lib/scoring'

export default function Groups() {
  const { matches } = useStore()

  const groups = useMemo(() => {
    const map = new Map()
    for (const m of matches) {
      if (m.stage !== 'GROUP_STAGE' || !m.group_name) continue
      if (!map.has(m.group_name)) map.set(m.group_name, [])
      map.get(m.group_name).push(m)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([name, ms]) => ({ name, table: computeGroupTable(ms) }))
  }, [matches])

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border-soft bg-white/60 p-10 text-center text-slate-500">
        Los grupos aparecerán cuando se carguen los partidos.
      </div>
    )
  }

  return (
    <section aria-label="Fase de grupos" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map(({ name, table }) => (
        <div key={name} className="animate-rise overflow-hidden rounded-2xl border-2 border-border-soft bg-white shadow-sm">
          <h3 className="bg-primary px-4 py-2.5 font-display text-xl font-bold uppercase tracking-wide text-on-primary">
            {name}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wider text-slate-400">
                <th scope="col" className="px-4 py-2 text-left font-semibold">Equipo</th>
                <th scope="col" className="px-1 py-2 text-center font-semibold" title="Jugados">J</th>
                <th scope="col" className="px-1 py-2 text-center font-semibold" title="Diferencia de goles">DG</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold" title="Puntos">Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => (
                <tr
                  key={row.team}
                  className={`border-b border-border-soft last:border-0 ${i < 2 ? 'bg-green-50/60' : ''}`}
                >
                  <td className="flex items-center gap-2 px-4 py-2.5 font-semibold text-foreground">
                    {row.crest ? (
                      <img src={row.crest} alt="" width="24" height="18" loading="lazy" className="h-4.5 w-6 rounded-sm object-cover shadow-sm" />
                    ) : (
                      <span aria-hidden="true" className="h-4.5 w-6 rounded-sm bg-slate-200" />
                    )}
                    <span className="truncate">{row.team}</span>
                  </td>
                  <td className="px-1 py-2.5 text-center tabular-nums text-slate-500">{row.played}</td>
                  <td className="px-1 py-2.5 text-center tabular-nums text-slate-500">
                    {row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}
                  </td>
                  <td className="px-4 py-2.5 text-right font-display text-lg font-bold tabular-nums text-foreground">
                    {row.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  )
}
