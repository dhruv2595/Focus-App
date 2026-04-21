import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const BACKGROUNDS = [
  {
    id: 'ocean',    label: 'Ocean',
    url:    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=3840&q=90',
    swatch: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=120&q=70',
  },
  {
    id: 'snow',     label: 'Snow',
    url:    'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=3840&q=90',
    swatch: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=120&q=70',
  },
  {
    id: 'clouds',   label: 'Clouds',
    url:    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=3840&q=90',
    swatch: 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=120&q=70',
  },
  {
    id: 'forest',   label: 'Forest',
    url:    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=3840&q=90',
    swatch: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=120&q=70',
  },
  {
    id: 'aurora',   label: 'Aurora',
    url:    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=3840&q=90',
    swatch: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=120&q=70',
  },
  {
    id: 'desert',   label: 'Desert',
    url:    'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=3840&q=90',
    swatch: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=120&q=70',
  },
]

const DURATIONS = [
  { label: '25', value: 25 * 60, sub: 'Pomodoro' },
  { label: '30', value: 30 * 60, sub: 'Focus' },
  { label: '60', value: 60 * 60, sub: 'Deep Work' },
]

const WMO_MAP = {
  0:  { icon: '☀️',  label: 'Clear' },
  1:  { icon: '🌤️', label: 'Mostly Clear' },
  2:  { icon: '⛅',  label: 'Partly Cloudy' },
  3:  { icon: '☁️',  label: 'Overcast' },
  45: { icon: '🌫️', label: 'Foggy' },
  48: { icon: '🌫️', label: 'Icy Fog' },
  51: { icon: '🌦️', label: 'Drizzle' },
  61: { icon: '🌧️', label: 'Light Rain' },
  63: { icon: '🌧️', label: 'Rain' },
  71: { icon: '❄️',  label: 'Light Snow' },
  80: { icon: '🌦️', label: 'Showers' },
  95: { icon: '⛈️',  label: 'Storm' },
}

function getWeather(code) {
  if (WMO_MAP[code]) return WMO_MAP[code]
  if (code <= 1)  return WMO_MAP[0]
  if (code <= 3)  return WMO_MAP[2]
  if (code <= 48) return WMO_MAP[45]
  if (code <= 55) return WMO_MAP[51]
  if (code <= 65) return WMO_MAP[63]
  if (code <= 77) return WMO_MAP[71]
  if (code <= 82) return WMO_MAP[80]
  return WMO_MAP[95]
}

// ─── Timer Ring ───────────────────────────────────────────────────────────────

const R = 110
const CIRC = 2 * Math.PI * R

const CX = 150  // SVG center x
const CY = 150  // SVG center y

function TimerRing({ progress, isRunning }) {
  const p = Math.max(0, Math.min(1, progress))
  // Depleting ring: starts full (offset=0), drains to empty (offset=CIRC)
  const arcOffset = CIRC * (1 - p)
  // Dot sits at the clockwise trailing edge of the remaining arc
  const dotAngle = -Math.PI / 2 + 2 * Math.PI * p
  const dotX = CX + R * Math.cos(dotAngle)
  const dotY = CY + R * Math.sin(dotAngle)

  return (
    <motion.div
      animate={isRunning ? { scale: [1, 1.006, 1] } : { scale: 1 }}
      transition={isRunning ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <svg width="300" height="300" viewBox="0 0 300 300" className="timer-svg" overflow="visible">
        <defs>
          {/* Glow for the progress arc */}
          <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComponentTransfer in="blur" result="brighter">
              <feFuncA type="linear" slope="1.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="brighter" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track ring — faint full circle */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />

        {/* Depleting progress arc */}
        <motion.circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={arcOffset}
          transform={`rotate(-90 ${CX} ${CY})`}
          filter="url(#arcGlow)"
          animate={{ strokeDashoffset: arcOffset }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Ticker dot — sits on the trailing edge of the arc */}
        <motion.circle
          r="3.5"
          fill="white"
          filter="url(#dotGlow)"
          animate={{ cx: dotX, cy: dotY }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
    </motion.div>
  )
}

// ─── Time & Date ──────────────────────────────────────────────────────────────

function TimeDate() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <motion.div
      className="glass time-panel"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
    >
      <div className="time-value">{time}</div>
      <div className="date-value">{date}</div>
    </motion.div>
  )
}

// ─── Weather ──────────────────────────────────────────────────────────────────

function WeatherWidget() {
  const [state, setState] = useState({ loading: true, data: null })

  useEffect(() => {
    if (!navigator.geolocation) { setState({ loading: false, data: null }); return }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const useFahrenheit = navigator.language?.startsWith('en-US')
          const unit = useFahrenheit ? 'fahrenheit' : 'celsius'
          const sym  = useFahrenheit ? '°F' : '°C'

          const [wRes, gRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=${unit}`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          ])
          const wData = await wRes.json()
          const gData = await gRes.json()

          const temp = Math.round(wData.current.temperature_2m)
          const info = getWeather(wData.current.weathercode)
          const city = gData.address?.city || gData.address?.town || gData.address?.village || ''

          setState({ loading: false, data: { temp, sym, city, ...info } })
        } catch {
          setState({ loading: false, data: null })
        }
      },
      () => setState({ loading: false, data: null })
    )
  }, [])

  return (
    <motion.div
      className="glass weather-panel"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
    >
      {state.loading ? (
        <span className="weather-dots">···</span>
      ) : state.data ? (
        <>
          <span className="weather-emoji">{state.data.icon}</span>
          <div className="weather-info">
            <span className="weather-temp">{state.data.temp}{state.data.sym}</span>
            {state.data.city && <span className="weather-city">{state.data.city}</span>}
          </div>
        </>
      ) : (
        <span className="weather-dots" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
          No location
        </span>
      )}
    </motion.div>
  )
}

// ─── Fullscreen Button ────────────────────────────────────────────────────────

function FullscreenButton() {
  const [isFs, setIsFs] = useState(false)

  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <motion.button
      className="icon-btn"
      onClick={toggle}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      aria-label={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.5 }}
      title={isFs ? 'Exit fullscreen' : 'Fullscreen'}
    >
      {isFs ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line x1="10" y1="14" x2="3" y2="21" />
          <line x1="21" y1="3" x2="14" y2="10" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      )}
    </motion.button>
  )
}

// ─── Brightness Control ───────────────────────────────────────────────────────

function BrightnessControl({ dimness, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="brightness-wrap" ref={ref}>
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass brightness-dropdown"
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <span className="brightness-label">Dimness</span>
            <input
              type="range"
              min="0" max="0.85" step="0.01"
              value={dimness}
              onChange={e => onChange(parseFloat(e.target.value))}
              className="dimness-slider"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="icon-btn"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Adjust dimness"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2"    x2="12" y2="5.5" />
          <line x1="12" y1="18.5" x2="12" y2="22" />
          <line x1="4.22" y1="4.22"   x2="6.4"  y2="6.4" />
          <line x1="17.6" y1="17.6"   x2="19.78" y2="19.78" />
          <line x1="2"    y1="12"  x2="5.5"  y2="12" />
          <line x1="18.5" y1="12"  x2="22"   y2="12" />
          <line x1="4.22" y1="19.78" x2="6.4"  y2="17.6" />
          <line x1="17.6" y1="6.4"   x2="19.78" y2="4.22" />
        </svg>
      </motion.button>
    </div>
  )
}

// ─── Background Selector ──────────────────────────────────────────────────────

function BackgroundSelector({ current, onSelect }) {
  return (
    <motion.div
      className="bottom-bar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="bg-swatches">
        {BACKGROUNDS.map(bg => (
          <motion.button
            key={bg.id}
            className={`bg-swatch ${current === bg.id ? 'active' : ''}`}
            style={{ backgroundImage: `url(${bg.swatch})` }}
            onClick={() => onSelect(bg.id)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.93 }}
            title={bg.label}
            aria-label={bg.label}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [bgId,    setBgId]    = useState('ocean')
  const [dimness, setDimness] = useState(0.28)

  const [selected,   setSelected]   = useState(DURATIONS[1])
  const [showCustom, setShowCustom] = useState(false)
  const [customMins, setCustomMins] = useState('')

  // 'idle' | 'running' | 'paused' | 'complete'
  const [phase,    setPhase]    = useState('idle')
  const [timeLeft, setTimeLeft] = useState(DURATIONS[1].value)
  const [total,    setTotal]    = useState(DURATIONS[1].value)

  const tickRef = useRef(null)
  const currentBg = BACKGROUNDS.find(b => b.id === bgId)

  const getActiveDuration = useCallback(() => {
    if (showCustom && customMins) {
      const m = parseInt(customMins)
      return m > 0 ? m * 60 : selected.value
    }
    return selected.value
  }, [showCustom, customMins, selected])

  // Sync display when idle + selection changes
  useEffect(() => {
    if (phase === 'idle') {
      const d = getActiveDuration()
      setTimeLeft(d)
      setTotal(d)
    }
  }, [selected, showCustom, customMins, phase, getActiveDuration])

  // Tick
  useEffect(() => {
    if (phase === 'running') {
      tickRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(tickRef.current)
            setPhase('complete')
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else {
      clearInterval(tickRef.current)
    }
    return () => clearInterval(tickRef.current)
  }, [phase])

  // Update document title
  useEffect(() => {
    if (phase === 'running' || phase === 'paused') {
      document.title = `${fmt(timeLeft)} — Focus`
    } else {
      document.title = 'Focus'
    }
  }, [timeLeft, phase])

  const begin = useCallback(() => {
    if (phase === 'idle' || phase === 'complete') {
      const d = getActiveDuration()
      setTimeLeft(d)
      setTotal(d)
    }
    setPhase('running')
  }, [phase, getActiveDuration])

  const pause   = () => setPhase('paused')
  const resume  = () => setPhase('running')

  const stop = useCallback(() => {
    clearInterval(tickRef.current)
    setPhase('idle')
    const d = getActiveDuration()
    setTimeLeft(d)
    setTotal(d)
  }, [getActiveDuration])

  const fmt = s => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const progress = total > 0 ? timeLeft / total : 1
  const isActive = phase === 'running' || phase === 'paused'

  return (
    <div className="app">
      {/* ── Background ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bgId}
          className="bg-layer"
          style={{ backgroundImage: `url(${currentBg.url})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        />
      </AnimatePresence>

      {/* ── Dimness overlay ── */}
      <motion.div
        className="dim-overlay"
        animate={{ opacity: dimness }}
        transition={{ duration: 0.08 }}
      />

      <div className="vignette" />
      <div className="noise-layer" />

      {/* ── UI ── */}
      <div className="ui-layer">
        {/* Top bar */}
        <div className="top-bar">
          <TimeDate />
          <div className="top-right">
            <WeatherWidget />
            <BrightnessControl dimness={dimness} onChange={setDimness} />
            <FullscreenButton />
          </div>
        </div>

        {/* Center */}
        <div className="timer-center">

          {/* Duration picker — hidden while active */}
          <AnimatePresence>
            {!isActive && phase !== 'complete' && (
              <motion.div
                className="duration-row"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                transition={{ duration: 0.3 }}
              >
                {DURATIONS.map(d => (
                  <motion.button
                    key={d.value}
                    className={`dur-btn ${!showCustom && selected.value === d.value ? 'active' : ''}`}
                    onClick={() => { setSelected(d); setShowCustom(false) }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    <span className="dur-num">{d.label}</span>
                    <span className="dur-sub">min</span>
                  </motion.button>
                ))}
                <motion.button
                  className={`dur-btn ${showCustom ? 'active' : ''}`}
                  onClick={() => setShowCustom(v => !v)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <span className="dur-num">+</span>
                  <span className="dur-sub">custom</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom minutes input */}
          <AnimatePresence>
            {showCustom && phase === 'idle' && (
              <motion.div
                className="custom-input-wrap"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <input
                  type="number"
                  className="custom-input"
                  placeholder="minutes"
                  value={customMins}
                  min="1" max="480"
                  onChange={e => setCustomMins(e.target.value)}
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ring */}
          <div className="ring-wrap">
            <TimerRing progress={progress} isRunning={phase === 'running'} />
            <div className="timer-overlay">
              <AnimatePresence mode="wait">
                {phase === 'complete' ? (
                  <motion.div
                    key="done"
                    className="complete-msg"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  >
                    Done ✦
                  </motion.div>
                ) : (
                  <motion.div
                    key="time"
                    className="timer-digits"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {fmt(timeLeft)}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="timer-status-label">
                {phase === 'idle'     && 'ready'}
                {phase === 'running'  && 'focusing'}
                {phase === 'paused'   && 'paused'}
                {phase === 'complete' && 'well done'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <motion.div
            className="controls-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
          >
            {(phase === 'idle' || phase === 'complete') && (
              <motion.button
                className="ctrl-btn primary"
                onClick={begin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {phase === 'complete' ? 'Again' : 'Begin'}
              </motion.button>
            )}

            {phase === 'running' && (
              <>
                <motion.button
                  className="ctrl-btn"
                  onClick={pause}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Pause
                </motion.button>
                <motion.button
                  className="ctrl-btn stop"
                  onClick={stop}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Stop
                </motion.button>
              </>
            )}

            {phase === 'paused' && (
              <>
                <motion.button
                  className="ctrl-btn primary"
                  onClick={resume}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Resume
                </motion.button>
                <motion.button
                  className="ctrl-btn stop"
                  onClick={stop}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Stop
                </motion.button>
              </>
            )}
          </motion.div>
        </div>

        {/* Bottom: background swatches */}
        <BackgroundSelector current={bgId} onSelect={setBgId} />
      </div>
    </div>
  )
}
