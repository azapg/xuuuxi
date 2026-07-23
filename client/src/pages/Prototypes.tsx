import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft01Icon,
  Cards02Icon,
  Copy01Icon,
  CrownIcon,
  GameController01Icon,
  Home02Icon,
  Layers01Icon,
  PlayIcon,
  Settings01Icon,
  Share01Icon,
  SparklesIcon,
  Tick01Icon,
  UserGroup02Icon,
  VolumeHighIcon,
} from 'hugeicons-react'
import './prototypes.css'

type Screen = 'lobby' | 'settings' | 'cards' | 'round'
type Concept = 'orbit' | 'stack' | 'signal'

const concepts: Array<{
  id: Concept
  number: string
  name: string
  note: string
}> = [
  {
    id: 'orbit',
    number: '01',
    name: 'Velvet Orbit',
    note: 'Social, flotante, juguetón',
  },
  {
    id: 'stack',
    number: '02',
    name: 'Rouge Stack',
    note: 'Táctil, editorial, enfocado',
  },
  {
    id: 'signal',
    number: '03',
    name: 'Afterdark Signal',
    note: 'Cinemático, denso, misterioso',
  },
]

const screens: Array<{
  id: Screen
  label: string
  short: string
  icon: typeof Home02Icon
}> = [
  { id: 'lobby', label: 'Sala', short: 'Sala', icon: Home02Icon },
  { id: 'settings', label: 'Ajustes', short: 'Ajustes', icon: Settings01Icon },
  { id: 'cards', label: 'Tus cartas', short: 'Cartas', icon: Cards02Icon },
  { id: 'round', label: 'En juego', short: 'Ronda', icon: GameController01Icon },
]

const players = [
  { name: 'Allan', initials: 'AZ', tone: 'ember', score: 3, host: true },
  { name: 'Mauricio', initials: 'MR', tone: 'wine', score: 2 },
  { name: 'Vale', initials: 'VA', tone: 'clay', score: 1 },
  { name: 'Diego', initials: 'DG', tone: 'smoke', score: 0 },
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

function FloatingChrome({
  concept,
  onConceptChange,
}: {
  concept: Concept
  onConceptChange: (concept: Concept) => void
}) {
  return (
    <>
      <div className="proto-exit-row">
        <Link className="proto-round-button" to="/" aria-label="Volver al juego">
          <ArrowLeft01Icon size={20} />
        </Link>
        <div className="proto-lab-pill">
          <SparklesIcon size={15} />
          <span>UI LAB</span>
          <i>12 pantallas</i>
        </div>
        <button className="proto-round-button" type="button" aria-label="Compartir prototipo">
          <Share01Icon size={19} />
        </button>
      </div>

      <div className="proto-concept-picker" role="tablist" aria-label="Dirección visual">
        {concepts.map(item => (
          <button
            key={item.id}
            className={concept === item.id ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={concept === item.id}
            onClick={() => onConceptChange(item.id)}
          >
            <b>{item.number}</b>
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function ScreenIntro({ concept, screen }: { concept: Concept; screen: Screen }) {
  const currentConcept = concepts.find(item => item.id === concept)!
  const currentScreen = screens.find(item => item.id === screen)!

  return (
    <div className="proto-screen-intro">
      <span>{currentConcept.name}</span>
      <strong>{currentScreen.label}</strong>
      <small>{currentConcept.note}</small>
    </div>
  )
}

function LobbyPrototype({ concept }: { concept: Concept }) {
  const [copied, setCopied] = useState(false)

  return (
    <section className="proto-screen proto-lobby" aria-label="Propuesta de sala">
      <ScreenIntro concept={concept} screen="lobby" />

      <button
        className="proto-code"
        type="button"
        onClick={() => {
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
          <div className={`proto-orbit-player proto-orbit-player--${index + 1}`} key={player.name}>
            <Avatar player={player} />
            <span>{player.name}</span>
          </div>
        ))}
      </div>

      <div className="proto-lobby-meta">
        <div>
          <Layers01Icon size={18} />
          <span>
            <small>Mazo</small>
            <b>Sin filtro</b>
          </span>
        </div>
        <div>
          <UserGroup02Icon size={18} />
          <span>
            <small>Meta</small>
            <b>7 puntos</b>
          </span>
        </div>
      </div>

      <button className="proto-primary-action" type="button">
        <PlayIcon size={19} />
        <span>Empezar la noche</span>
        <i>4/4 listos</i>
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
      onClick={() => setEnabled(value => !value)}
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
        <button type="button" onClick={() => setValue(Math.max(1, value - 1))}>
          −
        </button>
        <b>{value}</b>
        <button type="button" onClick={() => setValue(value + 1)}>
          +
        </button>
      </div>
    </div>
  )
}

function SettingsPrototype({ concept }: { concept: Concept }) {
  const [mode, setMode] = useState<'czar' | 'vote'>('czar')
  const [deck, setDeck] = useState('Sin filtro')

  return (
    <section className="proto-screen proto-settings" aria-label="Propuesta de ajustes">
      <ScreenIntro concept={concept} screen="settings" />

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

        <div className="proto-setting-block">
          <label>Quién decide</label>
          <div className="proto-segmented">
            <button
              type="button"
              className={mode === 'czar' ? 'is-active' : ''}
              onClick={() => setMode('czar')}
            >
              Juez rotativo
            </button>
            <button
              type="button"
              className={mode === 'vote' ? 'is-active' : ''}
              onClick={() => setMode('vote')}
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
                onClick={() => setDeck(item)}
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

        <button className="proto-save-action" type="button">
          Guardar este caos
          <Tick01Icon size={18} />
        </button>
      </div>
    </section>
  )
}

function CardsPrototype({ concept }: { concept: Concept }) {
  const [selected, setSelected] = useState(1)
  const visibleHand = useMemo(() => {
    const start = Math.max(0, Math.min(selected - 1, hand.length - 3))
    return hand.slice(start, start + 3).map((text, index) => ({
      text,
      originalIndex: start + index,
    }))
  }, [selected])

  return (
    <section className="proto-screen proto-cards" aria-label="Propuesta de selector de cartas">
      <div className="proto-round-status">
        <span>RONDA 04</span>
        <b>00:42</b>
        <button type="button" aria-label="Activar sonido">
          <VolumeHighIcon size={17} />
        </button>
      </div>

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
        <b>{selected + 1} de {hand.length}</b>
      </div>

      <div className="proto-card-carousel">
        {visibleHand.map((card, index) => {
          const isSelected = card.originalIndex === selected
          return (
            <button
              key={card.text}
              type="button"
              className={`proto-answer-card proto-answer-card--${index} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setSelected(card.originalIndex)}
            >
              <span>{card.text}</span>
              <small>QX · {String(card.originalIndex + 12).padStart(2, '0')}</small>
              {isSelected && (
                <i>
                  <Tick01Icon size={16} />
                </i>
              )}
            </button>
          )
        })}
      </div>

      <div className="proto-card-dots" aria-hidden="true">
        {hand.map((_, index) => (
          <i key={index} className={index === selected ? 'is-active' : ''} />
        ))}
      </div>

      <button className="proto-primary-action proto-primary-action--submit" type="button">
        <Cards02Icon size={19} />
        <span>Jugar esta carta</span>
        <i>Mantén para confirmar</i>
      </button>
    </section>
  )
}

function RoundPrototype({ concept }: { concept: Concept }) {
  const [reacted, setReacted] = useState(false)
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

      <div className="proto-reaction-row">
        {['SUCIO', 'BRUTAL', 'NO PUEDE SER'].map((label, index) => (
          <button
            key={label}
            type="button"
            className={reacted && index === 1 ? 'is-active' : ''}
            onClick={() => setReacted(index === 1)}
          >
            <i>{index === 0 ? '×' : index === 1 ? '!' : '?'}</i>
            <span>{label}</span>
          </button>
        ))}
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

function BottomTabs({
  screen,
  onScreenChange,
}: {
  screen: Screen
  onScreenChange: (screen: Screen) => void
}) {
  return (
    <nav className="proto-tabs" aria-label="Pantallas del prototipo">
      {screens.map(item => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            className={screen === item.id ? 'is-active' : ''}
            onClick={() => onScreenChange(item.id)}
          >
            <i>
              <Icon size={21} />
            </i>
            <span>{item.short}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default function Prototypes() {
  const [concept, setConcept] = useState<Concept>('orbit')
  const [screen, setScreen] = useState<Screen>('lobby')

  return (
    <div className={`proto-lab proto-lab--${concept}`}>
      <div className="proto-ambient proto-ambient--one" />
      <div className="proto-ambient proto-ambient--two" />
      <div className="proto-grain" />

      <FloatingChrome concept={concept} onConceptChange={setConcept} />

      <div className="proto-device">
        <div className="proto-device__edge" />
        <div className="proto-device__island" />
        <main className="proto-device__screen">
          {screen === 'lobby' && <LobbyPrototype concept={concept} />}
          {screen === 'settings' && <SettingsPrototype concept={concept} />}
          {screen === 'cards' && <CardsPrototype concept={concept} />}
          {screen === 'round' && <RoundPrototype concept={concept} />}
          <BottomTabs screen={screen} onScreenChange={setScreen} />
        </main>
      </div>

      <aside className="proto-desktop-note">
        <span>EXPLORACIÓN {concepts.findIndex(item => item.id === concept) + 1}/3</span>
        <h1>{concepts.find(item => item.id === concept)?.name}</h1>
        <p>{concepts.find(item => item.id === concept)?.note}. Cambia de pantalla con las pestañas inferiores.</p>
        <div>
          {screens.map(item => (
            <button
              key={item.id}
              type="button"
              className={screen === item.id ? 'is-active' : ''}
              onClick={() => setScreen(item.id)}
            >
              <span>{String(screens.indexOf(item) + 1).padStart(2, '0')}</span>
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
