import { isKnockout, POINTS } from './config'

// Estados de un partido según football-data.org
export const isFinished = (m) => m.status === 'FINISHED'
export const isLive = (m) => m.status === 'IN_PLAY' || m.status === 'PAUSED'
export const hasStarted = (m) =>
  isLive(m) || isFinished(m) || new Date(m.utc_date) <= new Date()
export const isBettable = (m) =>
  (m.status === 'SCHEDULED' || m.status === 'TIMED') &&
  new Date(m.utc_date) > new Date() &&
  m.home_team && m.away_team

// Resultado real de un partido en clave 1/X/2.
// En eliminatorias cuenta quién pasa (prórroga/penaltis incluidos), nunca hay X.
export function matchOutcome(m) {
  if (!isFinished(m)) return null
  if (isKnockout(m.stage)) {
    if (m.winner === 'HOME_TEAM') return '1'
    if (m.winner === 'AWAY_TEAM') return '2'
    return null
  }
  if (m.home_score > m.away_score) return '1'
  if (m.home_score < m.away_score) return '2'
  return 'X'
}

export function pointsForMatch(m) {
  return isKnockout(m.stage) ? POINTS.KNOCKOUT : POINTS.GROUP
}

// Clasificación: [{player, points, hits, played}] ordenada.
// filter(match) opcional para limitar a una fase (grupos / eliminatoria).
export function computeLeaderboard(players, matches, bets, filter = null) {
  const byId = new Map(matches.map((m) => [m.id, m]))
  const rows = players.map((p) => ({ player: p, points: 0, hits: 0, played: 0 }))
  const rowByPlayer = new Map(rows.map((r) => [r.player.id, r]))

  for (const bet of bets) {
    const m = byId.get(bet.match_id)
    const row = rowByPlayer.get(bet.player_id)
    if (!m || !row || !bet.pick) continue
    if (filter && !filter(m)) continue
    const outcome = matchOutcome(m)
    if (!outcome) continue
    row.played += 1
    if (bet.pick === outcome) {
      row.hits += 1
      row.points += pointsForMatch(m)
    }
  }
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.hits - a.hits ||
      a.player.name.localeCompare(b.player.name, 'es'),
  )
  return rows
}

// Filtros de fase para las dos clasificaciones
export const groupOnly = (m) => !isKnockout(m.stage)
export const knockoutOnly = (m) => isKnockout(m.stage)

// ¿Se ha jugado (acabado) algún partido de esta fase?
export const phaseHasResults = (matches, knockout) =>
  matches.some((m) => isFinished(m) && isKnockout(m.stage) === knockout)

// Tabla de un grupo a partir de sus partidos (pts, dif. goles, goles a favor)
export function computeGroupTable(groupMatches) {
  const table = new Map()
  const row = (team, crest) => {
    if (!table.has(team))
      table.set(team, { team, crest, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 })
    return table.get(team)
  }
  for (const m of groupMatches) {
    if (m.home_team) row(m.home_team, m.home_crest)
    if (m.away_team) row(m.away_team, m.away_crest)
    if (!isFinished(m) && !isLive(m)) continue
    if (m.home_score == null || m.away_score == null) continue
    const h = row(m.home_team, m.home_crest)
    const a = row(m.away_team, m.away_crest)
    h.played++; a.played++
    h.gf += m.home_score; h.ga += m.away_score
    a.gf += m.away_score; a.ga += m.home_score
    if (m.home_score > m.away_score) { h.won++; a.lost++; h.pts += 3 }
    else if (m.home_score < m.away_score) { a.won++; h.lost++; a.pts += 3 }
    else { h.drawn++; a.drawn++; h.pts++; a.pts++ }
  }
  return [...table.values()].sort(
    (x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.team.localeCompare(y.team, 'es'),
  )
}
