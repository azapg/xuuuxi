import { useGame } from '@/context/GameProvider'

export default function ScoreboardView() {
  const { gameState, kickPlayer } = useGame()

  if (!gameState) return null

  const sorted = [...gameState.players].sort((a, b) => b.score - a.score)
  const topScore = sorted[0]?.score ?? 0
  const isHost = gameState.me.isHost
  const inLobby = gameState.phase === 'LOBBY'

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
              {p.isHost && <span className="player-icon" title="Host">👑 </span>}
              {p.isJudge && <span className="player-icon" title="Juez">⚖️ </span>}
              {p.name}
              {isMe && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (tú)</span>
              )}
            </span>

            {/* Status indicators */}
            {gameState.phase === 'PLAYING' && !p.isJudge && (
              <span
                style={{ fontSize: '0.8rem' }}
                title={p.hasSubmitted ? 'Enviado' : 'Pendiente'}
              >
                {p.hasSubmitted ? '✅' : '⏳'}
              </span>
            )}

            {gameState.phase === 'JUDGING' && (
              <span
                style={{ fontSize: '0.8rem' }}
                title={p.hasVoted ? 'Votó' : 'Pendiente'}
              >
                {p.hasVoted ? '🗳️' : '⏳'}
              </span>
            )}

            <span className="player-score">{p.score}</span>

            {/* Kick button (host only, not self) */}
            {isHost && !isMe && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => kickPlayer(p.id)}
                title="Expulsar"
              >
                ✕
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
