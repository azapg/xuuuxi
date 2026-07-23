import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AnalyticsUpIcon,
  ArrowLeft01Icon,
  Cards02Icon,
  Copy01Icon,
  CrownIcon,
  GameController01Icon,
  Home02Icon,
  Layers01Icon,
  PlayIcon,
  Settings01Icon,
  SparklesIcon,
  Tick01Icon,
  UserGroup02Icon,
  VolumeHighIcon,
} from 'hugeicons-react'
import { CylinderCarousel } from '@/components/CylinderCarousel'
import { playSound } from '@/lib/sound'
import './prototypes.css'

type Screen = 'lobby' | 'settings' | 'cards' | 'round'

const screens: Array<{
  id: Screen
  label: string
  icon: typeof Home02Icon
}> = [
  { id: 'lobby', label: 'Sala', icon: Home02Icon },
  { id: 'settings', label: 'Ajustes', icon: Settings01Icon },
  { id: 'cards', label: 'Tus cartas', icon: Cards02Icon },
  { id: 'round', label: 'En juego', icon: GameController01Icon },
]

const players = [
  { name: 'Allan', initials: 'AZ', tone: 'ember', score: 3, host: true, submitted: true },
  { name: 'Mauricio', initials: 'MR', tone: 'wine', score: 2, submitted: true },
  { name: 'Vale', initials: 'VA', tone: 'clay', score: 1, submitted: false },
  { name: 'Diego', initials: 'DG', tone: 'smoke', score: 0, submitted: true },
]

const hand = [
  'La nota de voz que nadie debió escuchar.',
  'Una cantidad preocupante de lubricante.',
  'Mentir en terapia para impresionar al psicólogo.',
  'El historial de búsquedas de tu papá.',
  'Un “¿estás despierto?” a las 3:17 a. m.',
]

function Avatar({
  player,
  size = 'md',
  active = false,
}: {
  player: (typeof players)[number]
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}) {
  return (
    <div
      className={`proto-avatar proto-avatar--${size} proto-avatar--${player.tone} ${active ? 'is-active' : ''}`}
      aria-label={player.name}
      title={player.name}
    >
      <span>{player.initials}</span>
      {player.host && <CrownIcon className="proto-avatar__crown" size={13} />}
    </div>
  )
}

function PrototypeHub({
  onOpenScreen,
}: {
  onOpenScreen: (screen: Screen) => void
}) {
  return (
    <main className="proto-hub">
      <div className="proto-hub__top">
        <Link className="proto-round-button" to="/" aria-label="Volver al juego">
          <ArrowLeft01Icon size={20} />
        </Link>
        <div className="proto-lab-pill">
          <SparklesIcon size={15} />
          <span>UI LAB</span>
          <i>04 pantallas</i>
        </div>
      </div>

      <header className="proto-hub__title">
        <span>PROTOTIPOS // 04</span>
        <h1>
          ELIGE UNA
          <i>PANTALLA</i>
        </h1>
        <p>Cada prueba abre como una experiencia completa. Usa Atrás en el navegador para volver a este índice.</p>
      </header>

      <div className="proto-hub__direction" aria-label="Dirección visual elegida">
        <span>DIRECCIÓN ÚNICA</span>
        <strong>PRINT RIOT</strong>
        <div>
          <i>PAPEL</i>
          <i>TINTA</i>
          <i>CAOS</i>
        </div>
      </div>

      <section className="proto-hub__screens" aria-label="Pantallas disponibles">
        {screens.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              className={`proto-hub-card proto-hub-card--${item.id}`}
              key={item.id}
              type="button"
              onClick={() => onOpenScreen(item.id)}
            >
              <span className="proto-hub-card__number">0{index + 1}</span>
              <Icon size={28} />
              <strong>{item.label}</strong>
              <small>
                {item.id === 'lobby' && 'Órbita social · código · reglas'}
                {item.id === 'settings' && 'Ritmo · mazo · control host'}
                {item.id === 'cards' && 'Carrusel · estado · envío'}
                {item.id === 'round' && 'Czar · reacciones · marcador'}
              </small>
              <i>ABRIR →</i>
            </button>
          )
        })}
      </section>

      <div className="proto-paper-shard proto-paper-shard--one">MOVE</div>
      <div className="proto-paper-shard proto-paper-shard--two">PLAY</div>
      <div className="proto-paper-shard proto-paper-shard--three">///</div>
    </main>
  )
}

function ScreenIntro({ screen }: { screen: Screen }) {
  const currentScreen = screens.find(item => item.id === screen)!

  return (
    <div className="proto-screen-intro">
      <span>XUUUXI // PRINT RIOT</span>
      <strong>{currentScreen.label}</strong>
      <small>Pantalla jugable</small>
    </div>
  )
}

function LobbyPrototype({
  onOpenSettings,
}: {
  onOpenSettings: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [quickSetting, setQuickSetting] = useState<'deck' | 'goal' | null>(null)
  const [deck, setDeck] = useState('Sin filtro')
  const [goal, setGoal] = useState(7)
  const [started, setStarted] = useState(false)

  return (
    <section className="proto-screen proto-lobby" aria-label="Propuesta de sala">
      <ScreenIntro screen="lobby" />

      <button
        className="proto-room-settings"
        type="button"
        onClick={() => {
          playSound('page')
          onOpenSettings()
        }}
      >
        <Settings01Icon size={18} />
        <span>REGLAS</span>
        <i>HOST</i>
      </button>

      <button
        className="proto-code"
        type="button"
        onClick={() => {
          playSound('success')
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        }}
      >
        <span>SALA PRIVADA</span>
        <strong>V8R4K</strong>
        <small>
          {copied ? <Tick01Icon size={14} /> : <Copy01Icon size={14} />}
          {copied ? 'Copiado' : 'Toca para copiar'}
        </small>
      </button>

      <div className="proto-social-stage">
        <div className="proto-social-orbit proto-social-orbit--one" />
        <div className="proto-social-orbit proto-social-orbit--two" />
        <div className="proto-host-core">
          <Avatar player={players[0]} size="lg" active />
          <span>Tu sala</span>
          <b>4 conectados</b>
        </div>
        {players.slice(1).map((player, index) => (
          <button
            className={`proto-orbit-player proto-orbit-player--${index + 1}`}
            key={player.name}
            type="button"
            onClick={() => playSound('whisper')}
          >
            <Avatar player={player} />
            <span>{player.name}</span>
          </button>
        ))}
      </div>

      <div className="proto-lobby-meta">
        <button
          type="button"
          aria-expanded={quickSetting === 'deck'}
          onClick={() => {
            playSound('cardLift')
            setQuickSetting(current => current === 'deck' ? null : 'deck')
          }}
        >
          <Layers01Icon size={18} />
          <span>
            <small>Mazo</small>
            <b>{deck}</b>
          </span>
          <i>EDITAR</i>
        </button>
        <button
          type="button"
          aria-expanded={quickSetting === 'goal'}
          onClick={() => {
            playSound('cardLift')
            setQuickSetting(current => current === 'goal' ? null : 'goal')
          }}
        >
          <UserGroup02Icon size={18} />
          <span>
            <small>Meta</small>
            <b>{goal} puntos</b>
          </span>
          <i>EDITAR</i>
        </button>
      </div>

      {quickSetting && (
        <div className="proto-quick-settings" role="dialog" aria-label={quickSetting === 'deck' ? 'Cambiar mazo' : 'Cambiar meta'}>
          <header>
            <span>{quickSetting === 'deck' ? 'MAZO RÁPIDO' : 'META RÁPIDA'}</span>
            <button type="button" aria-label="Cerrar ajustes rápidos" onClick={() => setQuickSetting(null)}>×</button>
          </header>
          <div>
            {(quickSetting === 'deck' ? ['Sin filtro', 'Panamá', 'Internas'] : [5, 7, 10]).map(option => {
              const selected = quickSetting === 'deck' ? deck === option : goal === option
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? 'is-active' : ''}
                  onClick={() => {
                    playSound('cardSlide')
                    if (quickSetting === 'deck') setDeck(String(option))
                    else setGoal(Number(option))
                    setQuickSetting(null)
                  }}
                >
                  {quickSetting === 'deck' ? option : `${option} PT`}
                  {selected && <Tick01Icon size={14} />}
                </button>
              )
            })}
          </div>
          <button className="proto-quick-settings__full" type="button" onClick={onOpenSettings}>
            VER TODOS LOS AJUSTES →
          </button>
        </div>
      )}

      <button
        className={`proto-primary-action ${started ? 'is-started' : ''}`}
        type="button"
        onClick={() => {
          playSound(started ? 'tick' : 'ready')
          setStarted(true)
        }}
      >
        <PlayIcon size={19} />
        <span>{started ? 'PARTIDA LISTA' : 'EMPEZAR PARTIDA'}</span>
        <i>{started ? 'CARGANDO…' : '4/4 LISTOS'}</i>
      </button>
    </section>
  )
}

function Toggle({
  label,
  note,
  initial = true,
}: {
  label: string
  note: string
  initial?: boolean
}) {
  const [enabled, setEnabled] = useState(initial)
  return (
    <button
      className="proto-toggle-row"
      type="button"
      aria-pressed={enabled}
      onClick={() => {
        playSound(enabled ? 'cardLift' : 'cardSlide')
        setEnabled(value => !value)
      }}
    >
      <span>
        <b>{label}</b>
        <small>{note}</small>
      </span>
      <i className={enabled ? 'is-on' : ''}>
        <em />
      </i>
    </button>
  )
}

function Stepper({ label, initial }: { label: string; initial: number }) {
  const [value, setValue] = useState(initial)
  return (
    <div className="proto-stepper">
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => { playSound('tick'); setValue(Math.max(1, value - 1)) }}>
          −
        </button>
        <b>{value}</b>
        <button type="button" onClick={() => { playSound('tick'); setValue(value + 1) }}>
          +
        </button>
      </div>
    </div>
  )
}

function SettingsPrototype() {
  const [mode, setMode] = useState<'czar' | 'vote'>('czar')
  const [deck, setDeck] = useState('Sin filtro')

  return (
    <section className="proto-screen proto-settings" aria-label="Propuesta de ajustes">
      <ScreenIntro screen="settings" />

      <div className="proto-settings-sheet">
        <div className="proto-sheet-handle" />
        <div className="proto-sheet-heading">
          <span>
            <small>SALA V8R4K</small>
            <strong>Que se ponga raro.</strong>
          </span>
          <div className="proto-mini-stack">
            {players.slice(0, 3).map(player => (
              <Avatar key={player.name} player={player} size="sm" />
            ))}
          </div>
        </div>

        <div className="proto-danger-meter">
          <span>NIVEL DE CAOS</span>
          <div><i /><i /><i /><i /><i /></div>
          <b>04</b>
        </div>

        <div className="proto-setting-block">
          <label>Quién decide</label>
          <div className="proto-segmented">
            <button
              type="button"
              className={mode === 'czar' ? 'is-active' : ''}
              onClick={() => { playSound('cardSlide'); setMode('czar') }}
            >
              Juez rotativo
            </button>
            <button
              type="button"
              className={mode === 'vote' ? 'is-active' : ''}
              onClick={() => { playSound('cardSlide'); setMode('vote') }}
            >
              Voto popular
            </button>
          </div>
        </div>

        <div className="proto-setting-block">
          <label>Mazo activo</label>
          <div className="proto-deck-pills">
            {['Sin filtro', 'Panamá', 'Internas'].map(item => (
              <button
                key={item}
                type="button"
                className={deck === item ? 'is-active' : ''}
                onClick={() => { playSound('cardRiffle'); setDeck(item) }}
              >
                {item}
                {deck === item && <Tick01Icon size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="proto-setting-pair">
          <Stepper label="Cartas" initial={7} />
          <Stepper label="Puntos" initial={7} />
        </div>

        <div className="proto-toggle-list">
          <Toggle label="Intercambios" note="Negocia cartas durante la ronda" />
          <Toggle label="Reloj de presión" note="60 segundos para responder" />
          <Toggle label="Cartas anónimas" note="Revela autores al final" initial={false} />
        </div>

        <button className="proto-save-action" type="button" onClick={() => playSound('success')}>
          BLOQUEAR REGLAS
          <Tick01Icon size={18} />
        </button>
      </div>
    </section>
  )
}

function CardsPrototype() {
  const [selected, setSelected] = useState(1)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [played, setPlayed] = useState(false)
  const [swaps, setSwaps] = useState(2)

  const playSelected = () => {
    playSound('success')
    setPlayed(true)
    window.setTimeout(() => setPlayed(false), 1100)
  }

  return (
    <section className={`proto-screen proto-cards ${played ? 'is-played' : ''}`} aria-label="Propuesta de selector de cartas">
      <div className="proto-round-status">
        <span>RONDA 04</span>
        <b>00:42</b>
        <button type="button" aria-label="Activar sonido">
          <VolumeHighIcon size={17} />
        </button>
      </div>

      <div className="proto-submit-status">
        <button
          type="button"
          onClick={() => {
            playSound('page')
            setShowScoreboard(value => !value)
          }}
          aria-expanded={showScoreboard}
        >
          <div>
            {players.map(player => (
              <span className={player.submitted ? 'is-done' : 'is-waiting'} key={player.name}>
                <Avatar player={player} size="sm" />
                {player.submitted ? <Tick01Icon size={11} /> : <i />}
              </span>
            ))}
          </div>
          <strong>3/4</strong>
          <small>ENVIARON</small>
          <AnalyticsUpIcon size={17} />
        </button>
      </div>

      {showScoreboard && (
        <>
          <button
            className="proto-scoreboard-scrim"
            type="button"
            aria-label="Cerrar clasificación"
            onClick={() => setShowScoreboard(false)}
          />
          <div className="proto-card-scoreboard" role="dialog" aria-modal="true" aria-label="Clasificación de la partida">
            <header>
              <span>CLASIFICACIÓN</span>
              <b>R04</b>
              <button type="button" aria-label="Cerrar clasificación" onClick={() => setShowScoreboard(false)}>×</button>
            </header>
            {players.map((player, index) => (
              <div key={player.name}>
                <i>{String(index + 1).padStart(2, '0')}</i>
                <Avatar player={player} size="sm" />
                <span>{player.name}</span>
                <b>{player.score} PT</b>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="proto-prompt-card">
        <span>COMPLETA LA FRASE</span>
        <p>Mi peor cita terminó con ______.</p>
        <small>ELIGE 1</small>
      </div>

      <div className="proto-selection-copy">
        <span>
          <i />
          Tu mano
        </span>
        <b>ARRASTRA · {selected + 1}/{hand.length}</b>
      </div>

      <div className="proto-restored-carousel">
        <CylinderCarousel
          itemSize={180}
          height={320}
          visibleItems={3}
          minScale={0.74}
          dragSpeed={1.2}
          arc={40}
          onIndexChange={setSelected}
          defaultIndex={selected}
        >
          {hand.map((text, index) => {
            const isSelected = index === selected
            return (
            <button
              key={text}
              type="button"
              className={`proto-scroll-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                playSound('cardSlide')
                setSelected(index)
              }}
            >
              <span>{text}</span>
              <small>QX · {String(index + 12).padStart(2, '0')}</small>
              {isSelected && (
                <i>
                  <Tick01Icon size={16} />
                </i>
              )}
            </button>
            )
          })}
        </CylinderCarousel>
      </div>

      <div className="proto-card-dots" aria-hidden="true">
        {hand.map((_, index) => (
          <i key={index} className={index === selected ? 'is-active' : ''} />
        ))}
      </div>

      <div className="proto-hand-tools">
        <button
          type="button"
          disabled={swaps === 0}
          onClick={() => {
            playSound('deal')
            setSelected(current => (current + 1) % hand.length)
            setSwaps(current => Math.max(0, current - 1))
          }}
        >
          <span>CAMBIAR CARTA</span>
          <b>{swaps} RESTANTES</b>
        </button>
        <button
          type="button"
          onClick={() => {
            playSound('page')
            setShowScoreboard(true)
          }}
        >
          <span>MARCADOR</span>
          <b>ALLAN LIDERA · 3 PT</b>
        </button>
      </div>

      <button className="proto-slam-submit" type="button" onClick={playSelected}>
        <span>JUGAR</span>
        <Cards02Icon size={20} />
        <b>CARTA {String(selected + 1).padStart(2, '0')}</b>
      </button>
      {played && <div className="proto-played-stamp">BLOQUEADA</div>}
    </section>
  )
}

function RoundPrototype() {
  const [sentReaction, setSentReaction] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  const reactions = [
    { emoji: '🔥', label: 'Fuego' },
    { emoji: '💀', label: 'Muerto' },
    { emoji: '😳', label: 'Qué fuerte' },
    { emoji: '🍑', label: 'Sospechoso' },
    { emoji: '🚩', label: 'Bandera roja' },
    { emoji: '🤡', label: 'Payaso' },
    { emoji: '🫦', label: 'Picante' },
  ]

  const sendMessage = () => {
    const cleanMessage = message.trim()
    if (!cleanMessage) return
    playSound('success')
    setSentMessage(cleanMessage)
    setMessage('')
  }

  return (
    <section className="proto-screen proto-round" aria-label="Propuesta de ronda activa">
      <div className="proto-round-status">
        <span>JUZGANDO</span>
        <b>00:18</b>
        <div className="proto-mini-stack">
          {players.slice(0, 3).map(player => (
            <Avatar key={player.name} player={player} size="sm" />
          ))}
        </div>
      </div>

      <div className="proto-round-copy">
        <span>VALE ES LA JUEZA</span>
        <h2>Se está tomando esto demasiado en serio.</h2>
      </div>

      <div className="proto-combo-card">
        <div className="proto-combo-card__prompt">
          <small>Mi peor cita terminó con…</small>
        </div>
        <div className="proto-combo-card__answer">
          <p>La nota de voz que nadie debió escuchar.</p>
          <span>RESPUESTA 03</span>
        </div>
      </div>

      {(sentReaction || sentMessage) && (
        <div className="proto-sent-reaction" aria-live="polite">
          {sentReaction && <strong>{sentReaction}</strong>}
          {sentMessage && <span>{sentMessage}</span>}
        </div>
      )}

      <div className="proto-judge-social">
        <div className="proto-sticker-wheel" aria-label="Reacciones rápidas">
          {reactions.map((reaction, index) => (
            <button
              className={`proto-sticker proto-sticker--${index + 1} ${sentReaction === reaction.emoji ? 'is-sent' : ''}`}
              key={reaction.label}
              type="button"
              aria-label={`Enviar ${reaction.label}`}
              onClick={() => {
                playSound('cardLift')
                setSentReaction(reaction.emoji)
                window.setTimeout(() => setSentReaction(null), 1500)
              }}
            >
              <span aria-hidden="true">{reaction.emoji}</span>
            </button>
          ))}
        </div>

        <form
          className="proto-message-composer"
          onSubmit={event => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <input
            aria-label="Mensaje para la sala"
            maxLength={72}
            placeholder="DI ALGO…"
            value={message}
            onChange={event => setMessage(event.target.value)}
          />
          <button type="submit" disabled={!message.trim()}>
            ENVIAR ↑
          </button>
        </form>
      </div>

      <div className="proto-score-strip">
        {players.map((player, index) => (
          <div className={index === 0 ? 'is-leading' : ''} key={player.name}>
            <Avatar player={player} size="sm" />
            <span>{player.name}</span>
            <b>{player.score}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Prototypes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedScreen = searchParams.get('screen')
  const screen = screens.some(item => item.id === requestedScreen) ? requestedScreen as Screen : null

  useEffect(() => {
    playSound('page')
  }, [screen])

  const openScreen = (nextScreen: Screen) => {
    navigate(`/prototypes?screen=${nextScreen}`)
  }

  return (
    <div className={`proto-lab ${screen ? 'proto-lab--immersive' : 'proto-lab--hub'}`}>
      <div className="proto-ambient proto-ambient--one" />
      <div className="proto-ambient proto-ambient--two" />
      <div className="proto-grain" />

      {!screen ? (
        <PrototypeHub onOpenScreen={openScreen} />
      ) : (
        <div className="proto-device">
          <main className="proto-device__screen">
            {screen === 'lobby' && (
              <LobbyPrototype
                onOpenSettings={() => navigate('/prototypes?screen=settings')}
              />
            )}
            {screen === 'settings' && <SettingsPrototype />}
            {screen === 'cards' && <CardsPrototype />}
            {screen === 'round' && <RoundPrototype />}
          </main>
        </div>
      )}
    </div>
  )
}
