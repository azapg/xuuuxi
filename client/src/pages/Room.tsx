import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameProvider'
import LobbyView from '@/components/LobbyView'
import PlayingView from '@/components/PlayingView'
import JudgingView from '@/components/JudgingView'
import RoundResultView from '@/components/RoundResultView'
import DiscardView from '@/components/DiscardView'
import ScoreboardView from '@/components/ScoreboardView'
import TradeView from '@/components/TradeView'
import { CrownIcon, MedalFirstPlaceIcon, MedalSecondPlaceIcon, MedalThirdPlaceIcon, RefreshIcon } from 'hugeicons-react'

export default function Room() {
  const { code } = useParams<{ code: string }>()
  const { gameState, connected, error, playAgain } = useGame()

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
    <div className={`game-layout ${gameState.phase === 'PLAYING' ? 'playing-mode' : ''}`}>
      <div className="game-main">
        {error && <div className="error-message">{error}</div>}
        {renderPhase()}
        {/* Trade overlay */}
        {gameState.trade && gameState.trade.status !== 'IDLE' && <TradeView />}
      </div>
      
      {gameState.phase !== 'PLAYING' && (
        <div className="game-sidebar">
          {/* Room code */}
          <div className="sidebar-panel">
            <div className="sidebar-panel-title">Código de Sala</div>
            <div className="room-code-display" style={{ fontSize: '1.5rem' }}>
              {gameState.roomCode}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="sidebar-panel">
            <div className="sidebar-panel-title">Jugadores</div>
            <ScoreboardView />
          </div>

          {/* Game info */}
          <div className="sidebar-panel">
            <div className="sidebar-panel-title">Info</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>Ronda: {gameState.roundNumber}</span>
              <span>Cartas restantes: {gameState.cardsRemaining}</span>
              <span>Modo: {gameState.settings.judgingMode === 'CZAR' ? 'Juez rotativo' : 'Voto popular'}</span>
              <span>
                Meta: {gameState.settings.winCondition === 'POINTS'
                  ? `${gameState.settings.pointsToWin} puntos`
                  : `${gameState.settings.totalRounds} rondas`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GameOverInline() {
  const { gameState, playAgain } = useGame()
  if (!gameState) return null

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <CrownIcon size={32} /> ¡Fin del Juego!
      </h2>
      <p style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '2rem' }}>
        ¡{winner?.name} gana con {winner?.score} puntos!
      </p>

      <div style={{ maxWidth: 400, margin: '0 auto', marginBottom: '2rem' }}>
        <ol className="player-list" style={{ listStyle: 'none', counterReset: 'rank' }}>
          {sortedPlayers.map((p, i) => (
            <li key={p.id} className={`player-item ${i === 0 ? 'leader' : ''}`}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i === 0 ? <MedalFirstPlaceIcon size={20} /> : i === 1 ? <MedalSecondPlaceIcon size={20} /> : i === 2 ? <MedalThirdPlaceIcon size={20} /> : `${i + 1}.`}
              </span>
              <span className="player-name">{p.name}</span>
              <span className="player-score">{p.score}</span>
            </li>
          ))}
        </ol>
      </div>

      {gameState.me.isHost && (
        <button className="btn btn-primary btn-lg" onClick={playAgain}>
          <RefreshIcon size={20} style={{ marginRight: '0.5rem' }} /> Jugar de Nuevo
        </button>
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
      <input
        className="input"
        type="text"
        placeholder="Tu nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={20}
        autoFocus
      />
      <button className="btn btn-primary btn-block" type="submit" disabled={!name.trim() || loading}>
        {loading ? <span className="loading-spinner" /> : 'Entrar'}
      </button>
      <button className="btn btn-ghost btn-block" type="button" onClick={() => navigate('/')}>
        Volver al Inicio
      </button>
    </form>
  )
}
