import { createClient } from '@supabase/supabase-js'
import { DEMO_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from './config'
import {
  buildDemoMatches,
  DEMO_PLAYERS,
  DEMO_BETS,
  DEMO_SETTINGS,
  DEMO_REACTIONS,
  DEMO_BUBBLES,
} from './demoData'
import {
  hasStarted,
  isBettable,
  isFinished,
  computeLeaderboard,
  groupOnly,
  knockoutOnly,
} from './scoring'
import { blobToDataUrl } from './image'

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
      const [players, matches, bets, settings, reactions, bubbles] = await Promise.all([
        supabase.from('players').select('id,name').order('name'),
        supabase.from('matches').select('*').order('utc_date'),
        supabase.from('bets').select('player_id,match_id,pick'),
        supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('reactions').select('player_id,match_id,emoji'),
        supabase.from('throne_bubbles').select('player_id,phase,message,gif,size'),
      ])
      const err = players.error || matches.error || bets.error
      if (err) throw new Error(translate(err.message))
      // settings/reactions/bubbles pueden no existir aún (SQL del trono sin
      // ejecutar): en ese caso la app funciona igual, solo sin esas funciones
      return {
        players: players.data,
        matches: matches.data,
        bets: bets.data,
        settings: settings.error ? null : settings.data,
        reactions: reactions.error ? [] : reactions.data,
        bubbles: bubbles.error ? [] : bubbles.data,
      }
    },

    // Sube una foto (ya comprimida) al bucket público y devuelve su URL
    async uploadCrownPhoto(session, blob) {
      const path = `trono/${session.id}-${Date.now()}.jpg`
      const { error } = await supabase.storage.from('porra').upload(path, blob, {
        contentType: 'image/jpeg',
      })
      if (error) throw new Error(translate(error.message))
      const { data } = supabase.storage.from('porra').getPublicUrl(path)
      return data.publicUrl
    },

    async react(session, matchId, emoji) {
      const { error } = await supabase.rpc('react', {
        p_player: session.id,
        p_pin: session.pin,
        p_match: matchId,
        p_emoji: emoji ?? '',
      })
      if (error) throw new Error(translate(error.message))
    },

    async setThrone(session, { phase, message, gif, title, size }) {
      const { error } = await supabase.rpc('set_throne', {
        p_player: session.id,
        p_pin: session.pin,
        p_phase: phase,
        p_message: message ?? '',
        p_gif: gif ?? '',
        p_title: title ?? '',
        p_size: size ?? 1,
      })
      if (error) throw new Error(translate(error.message))
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, onChange)
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
      const state = JSON.parse(localStorage.getItem(DEMO_KEY))
      return { players: [], bets: [], settings: null, reactions: [], bubbles: [], ...(state || {}) }
    } catch {
      return { players: [], bets: [], settings: null, reactions: [], bubbles: [] }
    }
  }

  const allPlayers = (state) => [
    ...DEMO_PLAYERS,
    ...state.players.map(({ id, name }) => ({ id, name })),
  ]
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
      const players = allPlayers(state)
      const byId = new Map(matches.map((m) => [m.id, m]))
      // Igual que en producción: el pick de los demás solo se ve tras el pitido inicial
      const bets = [...DEMO_BETS, ...state.bets].map((b) => {
        const m = byId.get(b.match_id)
        return m && hasStarted(m) ? b : { ...b, pick: null }
      })
      // El bocadillo es por persona y fase; los del estado local pisan a los demo
      const bubbles = [...DEMO_BUBBLES, ...state.bubbles]
      const merged = [...new Map(bubbles.map((b) => [`${b.player_id}-${b.phase}`, b])).values()]
      return {
        players,
        matches,
        bets,
        settings: state.settings || DEMO_SETTINGS,
        reactions: [...DEMO_REACTIONS, ...state.reactions],
        bubbles: merged,
      }
    },

    async setThrone(session, { phase, message, gif, title, size }) {
      const state = load()
      const allBets = [...DEMO_BETS, ...state.bets]
      const filter = phase === 'KNOCKOUT' ? knockoutOnly : groupOnly
      const board = computeLeaderboard(allPlayers(state), matches, allBets, filter)
      const max = board[0]?.points || 0
      const isKing = max > 0 && board.some((r) => r.points === max && r.player.id === session.id)
      if (!isKing) {
        throw new Error('Solo el campeón de esta fase puede hacer esto. ¡Gana partidos!')
      }
      // Bocadillo de ESTA persona en ESTA fase (upsert)
      const msg = (message || '').trim().slice(0, 80) || null
      const img = (gif || '').trim() || null
      const sz = Math.min(4, Math.max(1, size || 1))
      state.bubbles = [
        ...state.bubbles.filter((b) => !(b.player_id === session.id && b.phase === phase)),
        { player_id: session.id, phase, message: msg, gif: img, size: sz },
      ]
      // El nombre de la porra sigue siendo global (una conquista compartida)
      const t = (title || '').trim().slice(0, 40) || null
      state.settings = {
        ...(state.settings || DEMO_SETTINGS),
        title: t,
        title_by: t ? session.id : null,
      }
      save(state)
    },

    // En demo la foto se guarda como data-URL en el propio navegador
    async uploadCrownPhoto(_session, blob) {
      return blobToDataUrl(blob)
    },

    async react(session, matchId, emoji) {
      const m = matches.find((x) => x.id === matchId)
      if (!m || !isFinished(m)) throw new Error('Solo se puede reaccionar a partidos acabados')
      const state = load()
      state.reactions = state.reactions.filter(
        (r) => !(r.player_id === session.id && r.match_id === matchId),
      )
      if (emoji) state.reactions.push({ player_id: session.id, match_id: matchId, emoji })
      save(state)
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
