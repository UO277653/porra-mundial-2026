import { createClient } from '@supabase/supabase-js'
import { DEMO_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from './config'
import { buildDemoMatches, DEMO_PLAYERS, DEMO_BETS } from './demoData'
import { hasStarted, isBettable } from './scoring'

// ─────────────────────────────────────────────────────────────
// Backend con dos implementaciones intercambiables:
//  - Supabase (real, compartido entre todos)
//  - Demo (localStorage, para probar la app sin configurar nada)
// ─────────────────────────────────────────────────────────────

function makeSupabaseBackend() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  return {
    demo: false,

    async register(name, pin) {
      const { data, error } = await supabase.rpc('register_player', {
        p_name: name,
        p_pin: pin,
      })
      if (error) throw new Error(translate(error.message))
      return { id: data, name }
    },

    async login(name, pin) {
      const { data, error } = await supabase.rpc('login_player', {
        p_name: name,
        p_pin: pin,
      })
      if (error) throw new Error(translate(error.message))
      if (!data) throw new Error('Nombre o PIN incorrectos.')
      return { id: data, name }
    },

    async fetchAll() {
      const [players, matches, bets] = await Promise.all([
        supabase.from('players').select('id,name').order('name'),
        supabase.from('matches').select('*').order('utc_date'),
        supabase.from('bets').select('player_id,match_id,pick'),
      ])
      const err = players.error || matches.error || bets.error
      if (err) throw new Error(translate(err.message))
      return { players: players.data, matches: matches.data, bets: bets.data }
    },

    async fetchMyBets(session) {
      const { data, error } = await supabase.rpc('my_bets', {
        p_player: session.id,
        p_pin: session.pin,
      })
      if (error) throw new Error(translate(error.message))
      return data
    },

    async placeBet(session, matchId, pick) {
      const { error } = await supabase.rpc('place_bet', {
        p_player: session.id,
        p_pin: session.pin,
        p_match: matchId,
        p_pick: pick,
      })
      if (error) throw new Error(translate(error.message))
    },

    // Tiempo real: cualquier cambio en partidos o apuestas → recargar datos
    subscribe(onChange) {
      const channel = supabase
        .channel('porra-cambios')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, onChange)
        .subscribe()
      return () => supabase.removeChannel(channel)
    },
  }
}

// Mensajes de error de Postgres → castellano
function translate(msg) {
  if (/ya existe|duplicate key/i.test(msg)) return 'Ese nombre ya está cogido.'
  if (/PIN incorrecto/i.test(msg)) return 'PIN incorrecto.'
  if (/empezado/i.test(msg)) return 'Este partido ya ha empezado: apuestas cerradas.'
  return msg
}

// ── MODO DEMO ────────────────────────────────────────────────

const DEMO_KEY = 'porra-mundial-demo-v1'

function makeDemoBackend() {
  const matches = buildDemoMatches()
  const listeners = new Set()

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(DEMO_KEY)) || { players: [], bets: [] }
    } catch {
      return { players: [], bets: [] }
    }
  }
  const save = (state) => {
    localStorage.setItem(DEMO_KEY, JSON.stringify(state))
    listeners.forEach((fn) => fn())
  }

  return {
    demo: true,

    async register(name, pin) {
      const state = load()
      const taken = [...DEMO_PLAYERS, ...state.players].some(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      )
      if (taken) throw new Error('Ese nombre ya está cogido.')
      const player = { id: `local-${Date.now()}`, name, pin }
      state.players.push(player)
      save(state)
      return { id: player.id, name }
    },

    async login(name, pin) {
      const state = load()
      const player = state.players.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() && p.pin === pin,
      )
      if (!player) throw new Error('Nombre o PIN incorrectos.')
      return { id: player.id, name: player.name }
    },

    async fetchAll() {
      const state = load()
      const players = [...DEMO_PLAYERS, ...state.players.map(({ id, name }) => ({ id, name }))]
      const byId = new Map(matches.map((m) => [m.id, m]))
      // Igual que en producción: el pick de los demás solo se ve tras el pitido inicial
      const bets = [...DEMO_BETS, ...state.bets].map((b) => {
        const m = byId.get(b.match_id)
        return m && hasStarted(m) ? b : { ...b, pick: null }
      })
      return { players, matches, bets }
    },

    async fetchMyBets(session) {
      const state = load()
      return state.bets
        .filter((b) => b.player_id === session.id)
        .map(({ match_id, pick }) => ({ match_id, pick }))
    },

    async placeBet(session, matchId, pick) {
      const m = matches.find((x) => x.id === matchId)
      if (!m || !isBettable(m)) throw new Error('Este partido ya ha empezado: apuestas cerradas.')
      const state = load()
      const existing = state.bets.find(
        (b) => b.player_id === session.id && b.match_id === matchId,
      )
      if (existing) existing.pick = pick
      else state.bets.push({ player_id: session.id, match_id: matchId, pick })
      save(state)
    },

    subscribe(onChange) {
      listeners.add(onChange)
      const onStorage = (e) => e.key === DEMO_KEY && onChange()
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onChange)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}

export const backend = DEMO_MODE ? makeDemoBackend() : makeSupabaseBackend()
