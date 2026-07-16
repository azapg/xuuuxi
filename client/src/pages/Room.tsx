import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameProvider'
import { useGameSounds } from '@/hooks/useGameSounds'
import LobbyView from '@/components/LobbyView'
import PlayingView from '@/components/PlayingView'
import JudgingView from '@/components/JudgingView'
import RoundResultView from '@/components/RoundResultView'
import DiscardView from '@/components/DiscardView'
import TradeView from '@/components/TradeView'
import { GameTopBar } from '@/components/GameTopBar'
import { CrownIcon, MedalFirstPlaceIcon, MedalSecondPlaceIcon, MedalThirdPlaceIcon, RefreshIcon } from 'hugeicons-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Room() {
  const { code } = useParams<{ code: string }>()
  const { gameState, connected, error } = useGame()

  useGameSounds()

  if (!connected) {
    return (
      <div className="page-center">
        <div className="loading-spinner" style={{ width: '2rem', height: '2rem' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          Conectando...
        </p>
      </div>
    )
  }

  if (error && !gameState) {
    return (
      <div className="page-center">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="page-center">
        <div style={{ maxWidth: 300, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Sala: {code}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Ingresa tu nombre para reconectarte
          </p>
          <JoinForm code={code || ''} />
        </div>
      </div>
    )
  }

  // Stage + carousel phases own the whole viewport (no scroll); the other
  // phases scroll normally under the top bar.
  const isImmersive =
    gameState.phase === 'PLAYING' ||
    gameState.phase === 'JUDGING' ||
    gameState.phase === 'DISCARD_PHASE'

  const renderPhase = () => {
    switch (gameState.phase) {
      case 'LOBBY':
        return <LobbyView />
      case 'PLAYING':
        return <PlayingView />
      case 'JUDGING':
        return <JudgingView />
      case 'ROUND_RESULT':
        return <RoundResultView />
      case 'DISCARD_PHASE':
        return <DiscardView />
      case 'GAME_OVER':
        return <GameOverInline />
      default:
        return null
    }
  }

  return (
    <div className={`game-layout ${isImmersive ? 'immersive' : ''}`}>
      <GameTopBar />
      <div className="game-main">
        {error && <div className="error-message">{error}</div>}
        {renderPhase()}
        {/* Trade overlay */}
        {gameState.trade && gameState.trade.status !== 'IDLE' && <TradeView />}
      </div>
    </div>
  )
}

const podiumStagger = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, type: 'spring' as const, stiffness: 300, damping: 24 },
  }),
}

function GameOverInline() {
  const { gameState, playAgain } = useGame()
  if (!gameState) return null

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <motion.h2
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textWrap: 'balance' }}
      >
        <CrownIcon size={32} /> ¡Fin del Juego!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '2rem' }}
      >
        ¡{winner?.name} gana con {winner?.score} puntos!
      </motion.p>

      <div style={{ maxWidth: 400, margin: '0 auto', marginBottom: '2rem' }}>
        <ol className="player-list" style={{ listStyle: 'none', counterReset: 'rank' }}>
          {sortedPlayers.map((p, i) => (
            <motion.li
              key={p.id}
              custom={i}
              variants={podiumStagger}
              initial="hidden"
              animate="visible"
              className={`player-item ${i === 0 ? 'leader' : ''}`}
            >
              <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i === 0 ? <MedalFirstPlaceIcon size={20} /> : i === 1 ? <MedalSecondPlaceIcon size={20} /> : i === 2 ? <MedalThirdPlaceIcon size={20} /> : `${i + 1}.`}
              </span>
              <span className="player-name">{p.name}</span>
              <span className="player-score">{p.score}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      {gameState.me.isHost && (
        <Button size="lg" onClick={playAgain}>
          <RefreshIcon size={20} /> Jugar de Nuevo
        </Button>
      )}
      {!gameState.me.isHost && (
        <p className="info-message">Esperando a que el host inicie otra partida...</p>
      )}
    </div>
  )
}

function JoinForm({ code }: { code: string }) {
  const { joinRoom, error } = useGame()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    joinRoom(code, name.trim())
  }

  return (
    <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && <div className="error-message" style={{ marginBottom: '0.5rem' }}>{error}</div>}
      <Input
        type="text"
        placeholder="Tu nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={20}
        autoFocus
      />
      <Button className="w-full" type="submit" disabled={!name.trim() || loading} isLoading={loading}>
        {!loading && 'Entrar'}
      </Button>
      <Button variant="ghost" className="w-full" type="button" onClick={() => navigate('/')}>
        Volver al Inicio
      </Button>
    </form>
  )
}
