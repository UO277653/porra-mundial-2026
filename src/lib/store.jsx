import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { backend } from './backend'
import { computeLeaderboard } from './scoring'

const Ctx = createContext(null)
const SESSION_KEY = 'porra-mundial-sesion'

export function StoreProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY))
    } catch {
      return null
    }
  })
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [bets, setBets] = useState([])
  const [myBets, setMyBets] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async (currentSession) => {
    try {
      const { players, matches, bets } = await backend.fetchAll()
      setPlayers(players)
      setMatches(matches)
      setBets(bets)
      const s = currentSession !== undefined ? currentSession : readSession()
      if (s) {
        try {
          const mine = await backend.fetchMyBets(s)
          setMyBets(new Map(mine.map((b) => [b.match_id, b.pick])))
        } catch {
          // Sesión guardada ya no válida (p. ej. base de datos reiniciada): fuera
          localStorage.removeItem(SESSION_KEY)
          setSession(null)
          setMyBets(new Map())
        }
      } else {
        setMyBets(new Map())
      }
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial + suscripción en tiempo real + refresco periódico
  // (el refresco periódico re-evalúa qué partidos han empezado ya)
  useEffect(() => {
    refresh()
    const unsubscribe = backend.subscribe(() => refresh())
    const interval = setInterval(() => refresh(), 60_000)
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [refresh])

  const saveSession = (s) => {
    setSession(s)
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  }

  const register = async (name, pin) => {
    const player = await backend.register(name.trim(), pin)
    const s = { ...player, pin }
    saveSession(s)
    await refresh(s)
  }

  const login = async (name, pin) => {
    const player = await backend.login(name.trim(), pin)
    const s = { ...player, pin }
    saveSession(s)
    await refresh(s)
  }

  const logout = () => {
    saveSession(null)
    setMyBets(new Map())
  }

  const placeBet = async (matchId, pick) => {
    if (!session) throw new Error('Inicia sesión para apostar.')
    await backend.placeBet(session, matchId, pick)
    setMyBets((prev) => new Map(prev).set(matchId, pick))
    refresh(session)
  }

  const leaderboard = useMemo(
    () => computeLeaderboard(players, matches, bets),
    [players, matches, bets],
  )

  const value = {
    demo: backend.demo,
    session,
    players,
    matches,
    bets,
    myBets,
    leaderboard,
    loading,
    error,
    register,
    login,
    logout,
    placeBet,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export const useStore = () => useContext(Ctx)
