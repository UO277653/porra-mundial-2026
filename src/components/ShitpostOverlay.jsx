import { useEffect, useRef, useState } from 'react'

// ─── Pon aquí el ID de un vídeo largo de Subway Surfers gameplay en YouTube ───
const SUBWAY_VIDEO_ID = 'n_Dv4JMiwK8'

// Carga automática de todas las imágenes en src/assets/shitpost/
const AD_IMAGES = Object.values(
  import.meta.glob('../assets/shitpost/*.{jpg,jpeg,png,gif,webp}', { eager: true, query: '?url', import: 'default' })
)

const BRAINROT = [
  '🗣️ NO CAP FR FR',
  '😳 WHEN THE IMPOSTOR IS SUS',
  '☠️ OHIO RIZZ UNLOCKED',
  '🚽 SKIBIDI TOILET',
  '🤖 NPC BEHAVIOR DETECTED',
  '💀 BRAIN ROT ACTIVATED',
  '🫡 W RIZZ',
  '🥁 TUNTUNG SAHUR 🥁',
  '😤 SIGMA GRINDSET',
  '🐱 SUSSY BAKA',
  '🔛🔝 STAY BASED',
  '💀 LITERALLY UNPLAYABLE',
  '🗿 MEWING DETECTED',
  '😂🙏 RESPECT + AFK',
  '🎯 HEADSHOT 🎯',
  '🦅 EAGLE RIZZ',
]

// Comandos de "hackeo" que escribe la terminal falsa
const HACK_LINES = [
  '> Iniciando protocolo de infiltración...',
  '> Conectando a NASA mainframe... OK',
  '> Bypassing firewall [████████████] 100%',
  '> Accediendo a cuenta bancaria de {user}...',
  '> Extrayendo contraseñas guardadas... 1,337 encontradas',
  '> Borrando historial de navegación (incluyendo el de incógnito)...',
  '> Enviando fotos a todos los contactos...',
  '> Minando Bitcoin con tu GPU...',
  '> Instalando virus.exe... completado ✓',
  '> Activando cámara web... 👁️',
  '> Uploading a darkweb... 99%',
  '> SISTEMA COMPROMETIDO',
]

const AMIGOS = ['Bruno', 'Gerardo', 'Adrian', 'Gabriel', 'Mario', 'Diego']
const rnd = () => AMIGOS[Math.floor(Math.random() * AMIGOS.length)]

const VIRUS_ALERTS_TPL = [
  { title: '⚠️ ALERTA DE SEGURIDAD', msg: (n) => `Se han detectado 1.337 virus en el PC de ${n}.\nSu información bancaria ha sido comprometida.`, btn: 'ENTENDIDO' },
  { title: '🔴 Windows Defender', msg: (n) => `Troyano detectado en el dispositivo de ${n}: PorraHacker.exe\nEl virus se está propagando por su red local.`, btn: 'Eliminar virus ($9.99)' },
  { title: '☠️ ADVERTENCIA CRÍTICA', msg: (n) => `La IP de ${n} ha sido registrada.\nLas autoridades han sido notificadas.`, btn: 'OK' },
  { title: '🦠 Avast Free Antivirus', msg: (n) => `¡El PC de ${n} está en PELIGRO!\n69 amenazas encontradas. Actúa AHORA.`, btn: 'Protegerme ya' },
  { title: '💀 Error del sistema', msg: (n) => `C:\\Users\\${n}\\System32 ha sido eliminado.\nPor favor reinicia tu ordenador.`, btn: 'Reiniciar (no)' },
  { title: '🕵️ FBI CYBER DIVISION', msg: (n) => `Actividad sospechosa detectada en la cuenta de ${n}.\nSe ha iniciado una investigación federal.`, btn: 'No soy yo' },
  { title: '📸 ADVERTENCIA', msg: (n) => `Hemos accedido a la cámara de ${n}.\nLas imágenes han sido guardadas correctamente.`, btn: 'DIOS MÍO' },
]

const randomAlert = () => {
  const tpl = VIRUS_ALERTS_TPL[Math.floor(Math.random() * VIRUS_ALERTS_TPL.length)]
  return { title: tpl.title, msg: tpl.msg(rnd()), btn: tpl.btn }
}

// Reproduce el sonido de quickscope desde public/quickscope.mp3
const quickscopeAudio = new Audio('/quickscope.mp3')
quickscopeAudio.volume = 0.7

function playQuickscope() {
  try {
    quickscopeAudio.currentTime = 0
    quickscopeAudio.play().catch(() => {})
  } catch {
    // silencio si no hay fichero aún
  }
}

// Sintetiza el tuntung sahur (redoble de tambor)
function playDrum() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    for (let i = 0; i < 6; i++) {
      const t = ctx.currentTime + i * 0.06
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let j = 0; j < data.length; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / data.length, 3)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buf
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.4, t)
      noise.connect(g)
      g.connect(ctx.destination)
      noise.start(t)
    }
  } catch { /* sin soporte */ }
}

// ── Componente ventana estilo Windows XP ──────────────────────────
function WinWindow({ title, children, onClose, style = {} }) {
  return (
    <div style={{
      background: '#ece9d8',
      border: '2px solid #0054e3',
      borderRadius: 6,
      boxShadow: '4px 4px 12px rgba(0,0,0,0.6)',
      minWidth: 320,
      maxWidth: 420,
      fontFamily: 'Tahoma, Arial, sans-serif',
      fontSize: 13,
      ...style,
    }}>
      {/* Barra de título XP */}
      <div style={{
        background: 'linear-gradient(to bottom, #2275d7, #0054e3)',
        padding: '4px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '4px 4px 0 0',
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{title}</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'linear-gradient(to bottom, #f06060, #c00)',
            color: '#fff',
            border: '1px solid #800',
            borderRadius: 3,
            width: 18,
            height: 18,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 900,
            lineHeight: 1,
            padding: 0,
          }}
        >✕</button>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

// ── Componente terminal CMD ────────────────────────────────────────
function FakeCmd({ onClose, username }) {
  const [lines, setLines] = useState([`Microsoft Windows [Versión 10.0.19045]\nC:\\Users\\${username}>`])
  const hackIdx = useRef(0)
  const glitchRef = useRef(null)

  useEffect(() => {
    const next = () => {
      if (hackIdx.current >= HACK_LINES.length) return
      const line = HACK_LINES[hackIdx.current].replace('{user}', username)
      hackIdx.current++
      setLines((prev) => [...prev, line])
      glitchRef.current = setTimeout(next, 600 + Math.random() * 800)
    }
    glitchRef.current = setTimeout(next, 400)
    return () => clearTimeout(glitchRef.current)
  }, [username])

  return (
    <WinWindow title="C:\Windows\System32\cmd.exe" onClose={onClose}>
      <div style={{
        background: '#000',
        color: '#00ff00',
        fontFamily: 'Courier New, monospace',
        fontSize: 12,
        padding: 10,
        borderRadius: 2,
        minHeight: 160,
        maxHeight: 220,
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
      }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
        <span style={{ animation: 'blink 1s step-end infinite' }}>█</span>
      </div>
    </WinWindow>
  )
}

export default function ShitpostOverlay({ active }) {
  const [popup, setPopup] = useState(null)
  const [drum, setDrum] = useState({ x: 120, y: 200 })
  const [ad, setAd] = useState(null)
  const [virusAlert, setVirusAlert] = useState(null)   // { title, msg, btn }
  const [showCmd, setShowCmd] = useState(false)
  const [glitch, setGlitch] = useState(false)          // efecto glitch pantalla

  const rafRef = useRef(null)
  const popupTimer = useRef(null)
  const adTimer = useRef(null)
  const virusTimer = useRef(null)
  const drumState = useRef({ x: 120, y: 200, vx: 2.8, vy: 1.7 })

  // Cada clic en un botón → quickscope
  useEffect(() => {
    if (!active) return
    const handler = (e) => {
      if (e.target.closest('button')) playQuickscope()
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [active])

  // 🥁 Tambor que rebota por la pantalla como el logo de DVD
  useEffect(() => {
    if (!active) return
    const s = drumState.current
    s.x = 120; s.y = 200; s.vx = 2.8; s.vy = 1.7

    const tick = () => {
      s.x += s.vx
      s.y += s.vy
      const maxX = window.innerWidth - 64
      const maxY = window.innerHeight - 64
      if (s.x <= 0 || s.x >= maxX) { s.vx *= -1; playDrum() }
      if (s.y <= 0 || s.y >= maxY) { s.vy *= -1; playDrum() }
      s.x = Math.max(0, Math.min(maxX, s.x))
      s.y = Math.max(0, Math.min(maxY, s.y))
      setDrum({ x: s.x, y: s.y })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  // Sistema de anuncios
  useEffect(() => {
    if (!active || AD_IMAGES.length === 0) return

    const showAd = () => {
      const src = AD_IMAGES[Math.floor(Math.random() * AD_IMAGES.length)]
      setAd({ src, skippable: false })
      const skipTimeout = setTimeout(() => setAd((prev) => prev ? { ...prev, skippable: true } : null), 3000)
      const closeTimeout = setTimeout(() => {
        setAd(null)
        adTimer.current = setTimeout(showAd, 10000)
      }, 5000)
      adTimer.current = { skipTimeout, closeTimeout }
    }

    adTimer.current = setTimeout(showAd, 10000)
    return () => {
      const t = adTimer.current
      if (t?.skipTimeout) { clearTimeout(t.skipTimeout); clearTimeout(t.closeTimeout) }
      else clearTimeout(t)
    }
  }, [active])

  const skipAd = () => {
    const t = adTimer.current
    if (t?.skipTimeout) { clearTimeout(t.skipTimeout); clearTimeout(t.closeTimeout) }
    else clearTimeout(t)
    setAd(null)
  }

  // 🦠 Sistema de virus: alerta → glitch → CMD
  useEffect(() => {
    if (!active) return

    const scheduleVirus = () => {
      virusTimer.current = setTimeout(() => {
        // 1. glitch de pantalla
        setGlitch(true)
        setTimeout(() => setGlitch(false), 400)

        // 2. popup de alerta Windows
        setTimeout(() => {
          setVirusAlert(randomAlert())
        }, 500)

        scheduleVirus()
      }, 15000 + Math.random() * 20000)
    }

    virusTimer.current = setTimeout(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 400)
      setTimeout(() => setVirusAlert(randomAlert()), 500)
      scheduleVirus()
    }, 5000)

    return () => clearTimeout(virusTimer.current)
  }, [active])

  const closeAlert = () => {
    setVirusAlert(null)
    // después de cerrar la alerta, abre la CMD
    setTimeout(() => setShowCmd(true), 300)
  }

  // Popups de brainrot aleatorios
  useEffect(() => {
    if (!active) return
    const schedule = () => {
      popupTimer.current = setTimeout(() => {
        setPopup(BRAINROT[Math.floor(Math.random() * BRAINROT.length)])
        setTimeout(() => setPopup(null), 2200)
        schedule()
      }, 5000 + Math.random() * 8000)
    }
    popupTimer.current = setTimeout(() => {
      setPopup(BRAINROT[Math.floor(Math.random() * BRAINROT.length)])
      setTimeout(() => setPopup(null), 2200)
      schedule()
    }, 2000)
    return () => clearTimeout(popupTimer.current)
  }, [active])

  if (!active) return null

  return (
    <>
      {/* Efecto glitch en toda la pantalla */}
      {glitch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999999,
          animation: 'glitch-flicker 0.4s steps(2) forwards',
          pointerEvents: 'none',
          background: 'rgba(255,0,0,0.15)',
          mixBlendMode: 'multiply',
        }} />
      )}

      {/* Subway Surfers — esquina inferior izquierda */}
      <div
        className="fixed bottom-4 left-4 z-50 overflow-hidden rounded-2xl shadow-2xl"
        style={{ width: 180, height: 320, border: '4px solid #facc15' }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${SUBWAY_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${SUBWAY_VIDEO_ID}&controls=0&disablekb=1&modestbranding=1`}
          allow="autoplay"
          style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
        />
        <div style={{
          position: 'absolute', top: 0, left: 0,
          background: '#facc15', color: '#000',
          fontSize: 11, fontWeight: 900, padding: '2px 8px', letterSpacing: 1,
        }}>
          🏄 SUBWAY SURFERS
        </div>
      </div>

      {/* 🥁 Tambor rebotando */}
      <div style={{
        position: 'fixed', left: drum.x, top: drum.y,
        fontSize: 48, zIndex: 9999,
        pointerEvents: 'none', userSelect: 'none',
        filter: 'drop-shadow(0 0 8px yellow)',
      }}>
        🥁
      </div>

      {/* Popup brainrot */}
      {popup && (
        <div style={{
          position: 'fixed', top: '35%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          background: '#000', color: '#fff',
          fontWeight: 900, fontSize: 28,
          padding: '16px 32px', borderRadius: 16,
          border: '4px solid #facc15', textAlign: 'center',
          textShadow: '3px 3px 0 red, -3px -3px 0 #2563eb',
          animation: 'shitpost-pop 0.15s ease-out',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {popup}
        </div>
      )}

      {/* Anuncio shitpost */}
      {ad && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#facc15', color: '#000',
            fontWeight: 900, fontSize: 13, letterSpacing: 3,
            padding: '4px 16px', borderRadius: '8px 8px 0 0',
            textTransform: 'uppercase',
          }}>
            📢 PUBLICIDAD
          </div>
          <div style={{ position: 'relative' }}>
            <img src={ad.src} alt="anuncio" style={{
              maxHeight: '75vh', maxWidth: '90vw',
              objectFit: 'contain', display: 'block',
              borderRadius: '0 0 12px 12px',
              border: '4px solid #facc15', borderTop: 'none',
            }} />
            <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
              {ad.skippable ? (
                <button type="button" onClick={skipAd} style={{
                  background: '#000', color: '#fff',
                  border: '2px solid #facc15',
                  padding: '6px 16px', fontWeight: 900,
                  fontSize: 14, borderRadius: 6, cursor: 'pointer', letterSpacing: 1,
                }}>
                  Saltar anuncio ⏭️
                </button>
              ) : (
                <div style={{
                  background: 'rgba(0,0,0,0.7)', color: '#aaa',
                  padding: '6px 16px', fontSize: 13, borderRadius: 6, fontWeight: 700,
                }}>
                  El anuncio puede omitirse en 3…
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🦠 Alerta de virus estilo Windows */}
      {virusAlert && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999998,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <WinWindow title={virusAlert.title} onClose={closeAlert}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 40, lineHeight: 1 }}>🛑</div>
              <div>
                <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5, color: '#000' }}>
                  {virusAlert.msg}
                </p>
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={closeAlert}
                    style={{
                      background: 'linear-gradient(to bottom, #f0f0f0, #d0d0d0)',
                      border: '1px solid #888',
                      borderRadius: 3,
                      padding: '4px 20px',
                      fontFamily: 'Tahoma, Arial, sans-serif',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {virusAlert.btn}
                  </button>
                </div>
              </div>
            </div>
          </WinWindow>
        </div>
      )}

      {/* 💻 Terminal CMD falsa */}
      {showCmd && (
        <div style={{
          position: 'fixed',
          bottom: 340,
          right: 20,
          zIndex: 9999997,
        }}>
          <FakeCmd onClose={() => setShowCmd(false)} username={rnd()} />
        </div>
      )}

      <style>{`
        @keyframes shitpost-pop {
          from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
        }
        @keyframes rainbow-bg {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glitch-flicker {
          0%   { opacity: 1; transform: translateX(-4px) skewX(-2deg); }
          25%  { opacity: 0.7; transform: translateX(4px) skewX(2deg); }
          50%  { opacity: 1; transform: translateX(-2px); filter: hue-rotate(90deg); }
          75%  { opacity: 0.5; transform: translateX(2px) skewX(-1deg); }
          100% { opacity: 0; }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        .shitpost-header {
          background: linear-gradient(270deg,#ff0000,#ff7700,#ffff00,#00ff00,#0000ff,#8b00ff) !important;
          background-size: 400% 400% !important;
          animation: rainbow-bg 2s ease infinite !important;
        }
      `}</style>
    </>
  )
}
