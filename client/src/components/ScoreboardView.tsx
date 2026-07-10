import { useGame } from '@/context/GameProvider'
import { CrownIcon, BalanceScaleIcon, Tick01Icon, HourglassIcon, CheckmarkBadge01Icon, Cancel01Icon } from 'hugeicons-react'
import { Button } from '@/components/ui/button'

export default function ScoreboardView() {
  const { gameState, kickPlayer } = useGame()

  if (!gameState) return null

  const sorted = [...gameState.players].sort((a, b) => b.score - a.score)
  const topScore = sorted[0]?.score ?? 0
  const isHost = gameState.me.isHost

  return (
    <ul className="player-list">
      {sorted.map(p => {
        const isLeader = p.score > 0 && p.score === topScore
        const isMe = p.id === gameState.me.id

        return (
          <li
            key={p.id}
            className={`player-item ${isLeader ? 'leader' : ''} ${!p.isConnected ? 'disconnected' : ''}`}
          >
            <span className={`status-dot ${p.isConnected ? 'online' : 'offline'}`} />

            <span className="player-name">
              {p.isHost && <span className="player-icon" title="Host"><CrownIcon size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /></span>}
              {p.isJudge && <span className="player-icon" title="Juez"><BalanceScaleIcon size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /></span>}
              {p.name}
              {isMe && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (tú)</span>
              )}
            </span>

            {/* Status indicators */}
            {gameState.phase === 'PLAYING' && !p.isJudge && (
              <span
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.5rem', color: p.hasSubmitted ? 'var(--success)' : 'var(--text-muted)' }}
                title={p.hasSubmitted ? 'Enviado' : 'Pendiente'}
              >
                {p.hasSubmitted ? <Tick01Icon size={16} /> : <HourglassIcon size={16} />}
              </span>
            )}

            {gameState.phase === 'JUDGING' && (
              <span
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.5rem', color: p.hasVoted ? 'var(--accent)' : 'var(--text-muted)' }}
                title={p.hasVoted ? 'Votó' : 'Pendiente'}
              >
                {p.hasVoted ? <CheckmarkBadge01Icon size={16} /> : <HourglassIcon size={16} />}
              </span>
            )}

            <span className="player-score">{p.score}</span>

            {/* Kick button (host only, not self) */}
            {isHost && !isMe && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => kickPlayer(p.id)}
                title="Expulsar"
              >
                <Cancel01Icon size={16} />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
