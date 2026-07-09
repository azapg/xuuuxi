import { useState, useEffect, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'

export default function JudgingView() {
  const { gameState, czarPick, vote } = useGame()
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)

  const isCzarMode = gameState?.settings.judgingMode === 'CZAR'
  const isJudge = gameState?.me.isJudge ?? false
  const hasVoted = gameState?.me.hasVoted ?? false
  const timer = gameState?.settings.judgingTimerSeconds ?? 0

  // Reset selection when phase changes
  useEffect(() => {
    setSelectedSubmission(null)
  }, [gameState?.phase])

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      setTimerSeconds(null)
      return
    }
    setTimerSeconds(timer)
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timer, gameState?.phase])

  const canPick = isCzarMode && isJudge && !hasVoted
  const canVote = !isCzarMode && !isJudge && !hasVoted

  const handleConfirm = useCallback(() => {
    if (!selectedSubmission) return
    if (canPick) {
      czarPick(selectedSubmission)
    } else if (canVote) {
      vote(selectedSubmission)
    }
  }, [selectedSubmission, canPick, canVote, czarPick, vote])

  if (!gameState) return null

  const votedPlayers = gameState.players.filter(p => p.hasVoted)
  const totalVoters = isCzarMode ? 1 : gameState.players.filter(p => !p.isJudge).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          {isCzarMode ? '⚖️ Fase de Juicio' : '🗳️ Votación Popular'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="badge badge-accent">
            {votedPlayers.length}/{totalVoters} votos
          </span>
          {timerSeconds !== null && timerSeconds > 0 && (
            <span className="timer-display">{timerSeconds}s</span>
          )}
        </div>
      </div>

      {/* Black card */}
      {gameState.currentBlackCard && (
        <div className="game-card black" style={{ maxWidth: 500, marginBottom: '2rem' }}>
          <div className="card-text">{gameState.currentBlackCard.text}</div>
          {gameState.currentBlackCard.pick > 1 && (
            <span className="card-pick-badge">
              Elige {gameState.currentBlackCard.pick}
            </span>
          )}
        </div>
      )}

      {/* Role message */}
      {isCzarMode && isJudge && (
        <div className="info-message" style={{ marginBottom: '1.5rem' }}>
          Elige la mejor respuesta
        </div>
      )}
      {isCzarMode && !isJudge && (
        <div className="info-message" style={{ marginBottom: '1.5rem' }}>
          El juez está eligiendo la mejor respuesta...
        </div>
      )}
      {!isCzarMode && !hasVoted && (
        <div className="info-message" style={{ marginBottom: '1.5rem' }}>
          Vota por la mejor respuesta (no puedes votar por la tuya)
        </div>
      )}
      {hasVoted && (
        <div className="info-message" style={{ marginBottom: '1.5rem' }}>
          ✅ ¡Voto registrado! Esperando a los demás...
        </div>
      )}

      {/* Submissions */}
      <div className="card-submissions">
        {gameState.submissions.map(sub => (
          <div
            key={sub.submissionId}
            className={`game-card white ${(canPick || canVote) ? 'selectable' : ''} ${
              selectedSubmission === sub.submissionId ? 'selected' : ''
            }`}
            onClick={() => {
              if (canPick || canVote) {
                setSelectedSubmission(
                  selectedSubmission === sub.submissionId ? null : sub.submissionId,
                )
              }
            }}
          >
            {sub.cards.map((card, i) => (
              <div key={card.id} className="card-text" style={i > 0 ? { marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--card-white-border)' } : undefined}>
                {card.text}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Confirm button */}
      {(canPick || canVote) && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn-primary btn-lg"
            disabled={!selectedSubmission}
            onClick={handleConfirm}
          >
            {isCzarMode ? '⚖️ Elegir Ganador' : '🗳️ Confirmar Voto'}
          </button>
        </div>
      )}
    </div>
  )
}
