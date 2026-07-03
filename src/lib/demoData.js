// Datos de ejemplo para el MODO DEMO (sin Supabase configurado).
// Las fechas se generan en relación a "ahora" para que siempre haya
// partidos jugados, uno en directo y próximos partidos que apostar.

const flag = (code) => `https://flagcdn.com/w80/${code}.png`

const T = {
  MEX: ['México', flag('mx')],
  CAN: ['Canadá', flag('ca')],
  USA: ['Estados Unidos', flag('us')],
  ESP: ['España', flag('es')],
  ARG: ['Argentina', flag('ar')],
  FRA: ['Francia', flag('fr')],
  BRA: ['Brasil', flag('br')],
  ENG: ['Inglaterra', flag('gb-eng')],
  GER: ['Alemania', flag('de')],
  POR: ['Portugal', flag('pt')],
  NED: ['Países Bajos', flag('nl')],
  JPN: ['Japón', flag('jp')],
  MAR: ['Marruecos', flag('ma')],
  URU: ['Uruguay', flag('uy')],
  COL: ['Colombia', flag('co')],
  CRO: ['Croacia', flag('hr')],
}

const H = 3600 * 1000
const now = Date.now()
const at = (hoursFromNow) => new Date(now + hoursFromNow * H).toISOString()

let nextId = 1
function match({ stage = 'GROUP_STAGE', group = null, matchday = null, home, away, date, status = 'TIMED', hs = null, as = null }) {
  const [homeName, homeCrest] = home ? T[home] : [null, null]
  const [awayName, awayCrest] = away ? T[away] : [null, null]
  let winner = null
  if (status === 'FINISHED' && hs != null) {
    winner = hs > as ? 'HOME_TEAM' : hs < as ? 'AWAY_TEAM' : 'DRAW'
  }
  return {
    id: nextId++,
    stage,
    group_name: group,
    matchday,
    utc_date: date,
    status,
    home_team: homeName,
    home_crest: homeCrest,
    away_team: awayName,
    away_crest: awayCrest,
    home_score: hs,
    away_score: as,
    winner,
  }
}

export function buildDemoMatches() {
  nextId = 1
  return [
    // ── Grupo A (jornadas 1 y 2 jugadas, hay un partido EN DIRECTO)
    match({ group: 'Grupo A', matchday: 1, home: 'MEX', away: 'JPN', date: at(-72), status: 'FINISHED', hs: 2, as: 1 }),
    match({ group: 'Grupo A', matchday: 1, home: 'URU', away: 'MAR', date: at(-70), status: 'FINISHED', hs: 0, as: 0 }),
    match({ group: 'Grupo A', matchday: 2, home: 'MEX', away: 'MAR', date: at(-26), status: 'FINISHED', hs: 1, as: 1 }),
    match({ group: 'Grupo A', matchday: 2, home: 'JPN', away: 'URU', date: at(-1), status: 'IN_PLAY', hs: 1, as: 0 }),
    match({ group: 'Grupo A', matchday: 3, home: 'MEX', away: 'URU', date: at(50) }),
    match({ group: 'Grupo A', matchday: 3, home: 'JPN', away: 'MAR', date: at(50) }),

    // ── Grupo B
    match({ group: 'Grupo B', matchday: 1, home: 'ESP', away: 'COL', date: at(-68), status: 'FINISHED', hs: 3, as: 1 }),
    match({ group: 'Grupo B', matchday: 1, home: 'CAN', away: 'CRO', date: at(-66), status: 'FINISHED', hs: 1, as: 2 }),
    match({ group: 'Grupo B', matchday: 2, home: 'ESP', away: 'CRO', date: at(4) }),
    match({ group: 'Grupo B', matchday: 2, home: 'COL', away: 'CAN', date: at(7) }),
    match({ group: 'Grupo B', matchday: 3, home: 'ESP', away: 'CAN', date: at(74) }),
    match({ group: 'Grupo B', matchday: 3, home: 'COL', away: 'CRO', date: at(74) }),

    // ── Grupo C
    match({ group: 'Grupo C', matchday: 1, home: 'ARG', away: 'GER', date: at(-44), status: 'FINISHED', hs: 2, as: 2 }),
    match({ group: 'Grupo C', matchday: 1, home: 'FRA', away: 'POR', date: at(-42), status: 'FINISHED', hs: 1, as: 0 }),
    match({ group: 'Grupo C', matchday: 2, home: 'ARG', away: 'POR', date: at(28) }),
    match({ group: 'Grupo C', matchday: 2, home: 'GER', away: 'FRA', date: at(31) }),
    match({ group: 'Grupo C', matchday: 3, home: 'ARG', away: 'FRA', date: at(98) }),
    match({ group: 'Grupo C', matchday: 3, home: 'GER', away: 'POR', date: at(98) }),

    // ── Eliminatorias: un par ya jugadas (campeonato de eliminatoria en marcha)
    match({ stage: 'LAST_32', home: 'BRA', away: 'NED', date: at(-20), status: 'FINISHED', hs: 2, as: 1 }),
    match({ stage: 'LAST_32', home: 'ENG', away: 'USA', date: at(-3), status: 'IN_PLAY', hs: 0, as: 1 }),
    match({ stage: 'LAST_32', home: 'ARG', away: 'CRO', date: at(48) }),
    match({ stage: 'LAST_32', home: null, away: null, date: at(165) }),
    match({ stage: 'LAST_16', home: null, away: null, date: at(220) }),
    match({ stage: 'LAST_16', home: null, away: null, date: at(225) }),
    match({ stage: 'QUARTER_FINALS', home: null, away: null, date: at(290) }),
    match({ stage: 'SEMI_FINALS', home: null, away: null, date: at(360) }),
    match({ stage: 'FINAL', home: null, away: null, date: at(430) }),
  ]
}

export const DEMO_PLAYERS = [
  { id: 'demo-laura', name: 'Laura' },
  { id: 'demo-carlos', name: 'Carlos' },
  { id: 'demo-marta', name: 'Marta' },
  { id: 'demo-pablo', name: 'Pablo' },
]

// Nombre de la porra en la demo (conquista global de quien manda)
export const DEMO_SETTINGS = {
  title: 'La porra de los pringados',
  title_by: 'demo-laura',
}

// Bocadillos por persona y fase (cada co-campeón tiene el suyo, con su tamaño)
export const DEMO_BUBBLES = [
  { player_id: 'demo-laura', phase: 'GROUP', message: '¿Apostáis o decoráis? 😏👑', gif: null, size: 2 },
  // Carlos y Pablo empatan primeros en eliminatoria: cada uno con su bocadillo
  { player_id: 'demo-carlos', phase: 'KNOCKOUT', message: 'En la fase buena mando yo 💪', gif: null, size: 2 },
  { player_id: 'demo-pablo', phase: 'KNOCKOUT', message: 'De aquí no me baja nadie 🧗', gif: null, size: 4 },
]

// Reacciones de ejemplo a los partidos acabados
export const DEMO_REACTIONS = [
  { player_id: 'demo-carlos', match_id: 1, emoji: '😭' },
  { player_id: 'demo-laura', match_id: 1, emoji: '🔥' },
  { player_id: 'demo-pablo', match_id: 7, emoji: '👏' },
  { player_id: 'demo-marta', match_id: 13, emoji: '😂' },
]

// Apuestas de los jugadores de ejemplo sobre los primeros partidos
export const DEMO_BETS = [
  { player_id: 'demo-laura', match_id: 1, pick: '1' },
  { player_id: 'demo-laura', match_id: 2, pick: 'X' },
  { player_id: 'demo-laura', match_id: 3, pick: '1' },
  { player_id: 'demo-laura', match_id: 7, pick: '1' },
  { player_id: 'demo-laura', match_id: 8, pick: '2' },
  { player_id: 'demo-laura', match_id: 13, pick: 'X' },
  { player_id: 'demo-carlos', match_id: 1, pick: '2' },
  { player_id: 'demo-carlos', match_id: 2, pick: '1' },
  { player_id: 'demo-carlos', match_id: 3, pick: 'X' },
  { player_id: 'demo-carlos', match_id: 7, pick: '1' },
  { player_id: 'demo-carlos', match_id: 13, pick: '1' },
  { player_id: 'demo-carlos', match_id: 14, pick: '1' },
  { player_id: 'demo-marta', match_id: 1, pick: '1' },
  { player_id: 'demo-marta', match_id: 3, pick: 'X' },
  { player_id: 'demo-marta', match_id: 7, pick: 'X' },
  { player_id: 'demo-marta', match_id: 8, pick: '2' },
  { player_id: 'demo-marta', match_id: 14, pick: '1' },
  { player_id: 'demo-pablo', match_id: 2, pick: '2' },
  { player_id: 'demo-pablo', match_id: 8, pick: '1' },
  { player_id: 'demo-pablo', match_id: 13, pick: '2' },
  { player_id: 'demo-pablo', match_id: 14, pick: '2' },

  // ── Eliminatoria: dieciseisavos (match 19 = BRA 2-1 NED, ya jugado)
  { player_id: 'demo-carlos', match_id: 19, pick: '1' }, // acierta (+2) → campeón de eliminatoria
  { player_id: 'demo-pablo', match_id: 19, pick: '1' }, // acierta (+2)
  { player_id: 'demo-laura', match_id: 19, pick: '2' }, // falla
  { player_id: 'demo-marta', match_id: 19, pick: '2' }, // falla
  // Apuestas sobre el partido en directo (match 20) — aún no puntúan
  { player_id: 'demo-carlos', match_id: 20, pick: '2' },
  { player_id: 'demo-laura', match_id: 20, pick: '1' },
]
