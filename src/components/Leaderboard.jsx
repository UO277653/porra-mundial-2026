import { useRef, useState } from 'react'
import { Crown, Medal, Target, Loader2, Sparkles, ImagePlus, Camera, Users, Swords } from 'lucide-react'
import { useStore } from '../lib/store'
import { compressImage } from '../lib/image'
import { phaseHasResults, rankBoard } from '../lib/scoring'

// Bocadillo del rey: solo existe mientras su autor siga siendo el nº 1 de su fase
function SpeechBubble({ message, gif }) {
  const [gifBroken, setGifBroken] = useState(false)
  if (!message && (!gif || gifBroken)) return null
  return (
    <div className="animate-pop relative mb-3 max-w-52">
      <div className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-white shadow-lg shadow-amber-100">
        {gif && !gifBroken && (
          <img
            src={gif}
            alt="Imagen del rey"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setGifBroken(true)}
            className="max-h-32 w-full object-cover"
          />
        )}
        {message && (
          <p className="px-3 py-2 text-center text-sm font-semibold text-foreground">
            {message}
          </p>
        )}
      </div>
      <span
        aria-hidden="true"
        className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-amber-300 bg-white"
      />
    </div>
  )
}

// Podio estilo Kahoot: 2º - 1º - 3º con alturas distintas.
// Cada pedestal es un TRAMO de puntos: si varios empatan, comparten pedestal
// (todos son 1º, 2º…). `tiers` = [grupoOro, grupoPlata, grupoBronce].
function Podium({ tiers, crown }) {
  const [gold, silver, bronze] = tiers
  const blocks = [
    { group: silver, place: 2, height: 'h-28', color: 'bg-silver', text: 'text-slate-600' },
    { group: gold, place: 1, height: 'h-40', color: 'bg-gold', text: 'text-amber-700' },
    { group: bronze, place: 3, height: 'h-20', color: 'bg-bronze', text: 'text-orange-100' },
  ]

  return (
    <div className="mx-auto flex max-w-lg items-end justify-center gap-2 px-2 sm:gap-3" aria-label="Podio">
      {blocks.map(({ group, place, height, color, text }) => (
        <div key={place} className="flex w-1/3 flex-col items-center">
          {group && group.length ? (
            <div className="animate-rise mb-2 flex flex-col items-center" style={{ animationDelay: `${place * 120}ms` }}>
              {place === 1 && crown && <SpeechBubble message={crown.message} gif={crown.gif} />}
              {place === 1 && (
                <Crown aria-hidden="true" className="mb-1 size-7 text-accent drop-shadow-sm" />
              )}
              {group.map((r) => (
                <span
                  key={r.player.id}
                  className={`max-w-full truncate font-display font-bold ${
                    group.length > 1 ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
                  } ${place === 1 ? 'gold-shine' : 'text-foreground'}`}
                >
                  {r.player.name}
                </span>
              ))}
              <span className="text-sm font-semibold text-slate-500 tabular-nums">
                {group[0].points} pts
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

const STICKERS = ['😂', '👑', '🔥', '💀', '🤡', '😎', '⚽', '🫵', '🥶', '😘']

// Panel que solo ve el campeón de ESTA fase: su bocadillo + el nombre de la porra
function ThroneControls({ phase }) {
  const { session, settings, setThrone, uploadCrownPhoto } = useStore()
  const knockout = phase === 'KNOCKOUT'
  // Lee/escribe las columnas del bocadillo de la fase correspondiente
  const bubbleBy = knockout ? settings?.ko_message_by : settings?.crown_message_by
  const bubbleMsg = knockout ? settings?.ko_message : settings?.crown_message
  const bubbleGif = knockout ? settings?.ko_gif : settings?.crown_gif
  // El mensaje/imagen solo se pre-rellenan si ya son tuyos; el del rey anterior no se hereda
  const mine = bubbleBy === session?.id
  const [message, setMessage] = useState(mine ? bubbleMsg || '' : '')
  const [gif, setGif] = useState(mine ? bubbleGif || '' : '')
  const [title, setTitle] = useState(settings?.title || '')
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setFeedback(null)
    try {
      const blob = await compressImage(file)
      const url = await uploadCrownPhoto(blob)
      setGif(url)
    } catch (err) {
      setFeedback({ ok: false, text: err.message })
    } finally {
      setPhotoBusy(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setFeedback(null)
    try {
      await setThrone({ phase, message, gif, title })
      setFeedback({ ok: true, text: 'Trono actualizado 👑' })
    } catch (err) {
      setFeedback({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="animate-rise mx-auto mt-6 max-w-2xl rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4 shadow-md shadow-amber-100 sm:p-5"
    >
      <h3 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide text-amber-700">
        <Sparkles aria-hidden="true" className="size-5" />
        Trono {knockout ? 'de la eliminatoria' : 'de la fase de grupos'}
      </h3>
      <p className="mb-4 mt-0.5 text-sm text-amber-800/70">
        Eres el campeón {knockout ? 'de la eliminatoria' : 'de grupos'}: tu bocadillo se muestra
        sobre tu nombre en este podio mientras nadie te destrone.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="throne-msg" className="mb-1 block text-sm font-semibold text-slate-700">
            Mensaje del bocadillo
          </label>
          <input
            id="throne-msg"
            type="text"
            maxLength={80}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="p. ej. Seguid intentándolo, plebe 👋"
            className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-base outline-none transition-colors focus:border-accent"
          />
          <div className="mt-2 flex flex-wrap gap-1" aria-label="Stickers rápidos">
            {STICKERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMessage((m) => (m + ' ' + s).trimStart().slice(0, 80))}
                aria-label={`Añadir sticker ${s}`}
                className="cursor-pointer rounded-lg bg-white px-2 py-1 text-lg shadow-sm transition-transform hover:scale-110 active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="throne-gif" className="mb-1 block text-sm font-semibold text-slate-700">
            GIF o foto (opcional)
          </label>
          <input
            id="throne-gif"
            type="url"
            maxLength={300}
            value={gif.startsWith('data:') ? '' : gif}
            onChange={(e) => setGif(e.target.value.trim())}
            placeholder="Pega el enlace de un GIF de Giphy o Tenor…"
            className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-base outline-none transition-colors focus:border-accent"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => galleryRef.current?.click()}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              <ImagePlus aria-hidden="true" className="size-4" /> …o sube una foto
            </button>
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => cameraRef.current?.click()}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              <Camera aria-hidden="true" className="size-4" /> …o hazla ahora
            </button>
            {photoBusy && <Loader2 aria-hidden="true" className="size-4 animate-spin text-amber-600" />}
            {gif && (
              <button
                type="button"
                onClick={() => setGif('')}
                className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-danger"
              >
                Quitar imagen
              </button>
            )}
          </div>
          <input ref={galleryRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          <input ref={cameraRef} type="file" accept="image/*" capture="user" onChange={onPhoto} className="hidden" />
          {gif && (
            <img
              src={gif}
              alt="Vista previa de la imagen del bocadillo"
              className="mt-2 max-h-28 rounded-xl border-2 border-amber-200 object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              onLoad={(e) => { e.currentTarget.style.display = '' }}
            />
          )}
        </div>

        <div>
          <label htmlFor="throne-title" className="mb-1 block text-sm font-semibold text-slate-700">
            Renombrar la porra (solo texto, sale en la cabecera para todos)
          </label>
          <input
            id="throne-title"
            type="text"
            maxLength={40}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="p. ej. La porra de los pringados"
            className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-base outline-none transition-colors focus:border-accent"
          />
        </div>

        {feedback && (
          <p
            role="alert"
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-danger'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-display text-lg font-bold uppercase tracking-wide text-white shadow-md shadow-amber-200 transition-all hover:bg-accent-dark active:scale-[0.98] disabled:opacity-50"
        >
          {busy && <Loader2 aria-hidden="true" className="size-5 animate-spin" />}
          Reinar
        </button>
      </div>
    </form>
  )
}

// Una clasificación (podio + tabla + trono) de una fase concreta
function PhaseBoard({ phase, board }) {
  const { session, matches, settings } = useStore()
  const knockout = phase === 'KNOCKOUT'

  if (!phaseHasResults(matches, knockout)) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border-soft bg-white/60 p-10 text-center text-slate-500">
        <Medal aria-hidden="true" className="mx-auto mb-3 size-10 text-slate-300" />
        {knockout
          ? 'La eliminatoria aún no ha empezado. Cuando se juegue el primer cruce, aquí saldrá su campeonato.'
          : 'Todavía no se ha jugado ningún partido de la fase de grupos.'}
      </div>
    )
  }

  // Puesto con empates: quienes empatan comparten puesto (todos 1º, 2º…)
  const ranked = rankBoard(board)
  const positive = ranked.filter((r) => r.points > 0)
  const tiers = [1, 2, 3].map((rk) => positive.filter((r) => r.rank === rk))
  const leaders = tiers[0] // co-campeones (todos empatados en lo más alto)

  // El bocadillo se ve si su autor sigue entre los co-campeones.
  // Cualquiera de los empatados puede tocar el trono (poner foto, mensaje…).
  const bubbleBy = knockout ? settings?.ko_message_by : settings?.crown_message_by
  const crown = leaders.some((r) => r.player.id === bubbleBy)
    ? {
        message: knockout ? settings?.ko_message : settings?.crown_message,
        gif: knockout ? settings?.ko_gif : settings?.crown_gif,
      }
    : null
  const isKing = session && leaders.some((r) => r.player.id === session.id)

  return (
    <div>
      <Podium tiers={tiers} crown={crown} />

      {isKing && <ThroneControls key={`${phase}-${session.id}`} phase={phase} />}

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
            {ranked.map((row, i) => {
              const me = session && row.player.id === session.id
              const medal = row.points > 0 && row.rank <= 3
              return (
                <tr
                  key={row.player.id}
                  className={`lb-row border-b border-border-soft last:border-0 ${
                    me ? 'bg-blue-50/80' : i % 2 ? 'bg-muted/40' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {medal ? (
                      <Medal
                        aria-label={`Puesto ${row.rank}`}
                        className={`size-5 ${row.rank === 1 ? 'text-gold' : row.rank === 2 ? 'text-silver' : 'text-bronze'}`}
                      />
                    ) : (
                      <span className="font-semibold text-slate-400 tabular-nums">{row.rank}</span>
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
        {knockout
          ? '2 puntos por cada acierto de quién pasa la eliminatoria.'
          : '1 punto por cada acierto en la fase de grupos.'}{' '}
        Se actualiza sola en cuanto acaba cada partido.
      </p>
    </div>
  )
}

const PHASES = [
  { key: 'GROUP', label: 'Grupos', icon: Users },
  { key: 'KNOCKOUT', label: 'Eliminatoria', icon: Swords },
]

export default function Leaderboard() {
  const { groupBoard, knockoutBoard } = useStore()
  const [phase, setPhase] = useState('GROUP')

  if (groupBoard.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border-soft bg-white/60 p-10 text-center text-slate-500">
        <Medal aria-hidden="true" className="mx-auto mb-3 size-10 text-slate-300" />
        Aún no hay nadie en la porra. ¡Sé el primero en registrarte!
      </div>
    )
  }

  const board = phase === 'KNOCKOUT' ? knockoutBoard : groupBoard

  return (
    <section aria-label="Clasificación">
      <div className="mx-auto mb-6 flex max-w-md gap-1 rounded-2xl bg-white p-1 shadow-sm" role="tablist">
        {PHASES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={phase === key}
            onClick={() => setPhase(key)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 font-display text-base font-semibold uppercase tracking-wide transition-colors sm:text-lg ${
              phase === key
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-slate-500 hover:bg-muted'
            }`}
          >
            <Icon aria-hidden="true" className="size-4.5" />
            {label}
          </button>
        ))}
      </div>

      <h2 className="mb-4 text-center font-display text-2xl font-bold uppercase tracking-wide text-slate-600">
        {phase === 'KNOCKOUT' ? 'Campeonato de eliminatoria' : 'Campeonato de la fase de grupos'}
      </h2>

      <PhaseBoard phase={phase} board={board} />
    </section>
  )
}
