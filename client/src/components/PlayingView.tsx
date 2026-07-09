import { useState, useEffect, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'

export default function PlayingView() {
  const { gameState, submitCards } = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)

  const pickCount = gameState?.currentBlackCard?.pick ?? 1
  const isJudge = gameState?.me.isJudge ?? false
  const hasSubmitted = gameState?.me.hasSubmitted ?? false
  const hand = gameState?.me.hand ?? []
  const timer = gameState?.settings.submissionTimerSeconds ?? 0

  // Reset selection on new round
  useEffect(() => {
    setSelectedIds([])
  }, [gameState?.roundNumber])

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
  }, [timer, gameState?.roundNumber])

  const toggleCard = useCallback(
    (cardId: string) => {
      if (hasSubmitted || isJudge) return
      setSelectedIds(prev => {
        if (prev.includes(cardId)) {
          return prev.filter(id => id !== cardId)
        }
        if (prev.length >= pickCount) {
          // Replace the last selected
          return [...prev.slice(0, pickCount - 1), cardId]
        }
        return [...prev, cardId]
      })
    },
    [hasSubmitted, isJudge, pickCount],
  )

  const handleSubmit = useCallback(() => {
    if (selectedIds.length !== pickCount) return
    submitCards(selectedIds)
  }, [selectedIds, pickCount, submitCards])

  if (!gameState) return null

  const submittedPlayers = gameState.players.filter(p => p.hasSubmitted)
  const totalNonJudge = gameState.players.filter(p => !p.isJudge).length

  return (
    <div>
      {/* Round info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          Ronda {gameState.roundNumber}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="badge badge-accent">
            {submittedPlayers.length}/{totalNonJudge} enviadas
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

      {/* Judge message */}
      {isJudge && (
        <div className="info-message" style={{ marginBottom: '1.5rem' }}>
          ⚖️ Eres el juez — espera las respuestas de los demás
        </div>
      )}

      {/* Already submitted */}
      {hasSubmitted && !isJudge && (
        <div className="info-message" style={{ marginBottom: '1.5rem' }}>
          ✅ ¡Cartas enviadas! Esperando a los demás...
        </div>
      )}

      {/* Player hand */}
      {!isJudge && !hasSubmitted && (
        <>
          <h3 className="section-title">Tu Mano</h3>
          <div className="card-hand">
            {hand.map(card => {
              const isSelected = selectedIds.includes(card.id)
              const selectionIndex = selectedIds.indexOf(card.id)
              return (
                <div
                  key={card.id}
                  className={`game-card white selectable ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleCard(card.id)}
                >
                  <div className="card-text">{card.text}</div>
                  {isSelected && (
                    <div className="card-meta">
                      {pickCount > 1 ? `#${selectionIndex + 1}` : '✓ Seleccionada'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={selectedIds.length !== pickCount}
              onClick={handleSubmit}
            >
              Enviar {pickCount > 1 ? `(${selectedIds.length}/${pickCount})` : 'Carta'}
            </button>
          </div>
        </>
      )}

      {/* Submitted players tracker */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Estado de envíos
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {gameState.players
            .filter(p => !p.isJudge)
            .map(p => (
              <span
                key={p.id}
                className={`badge ${p.hasSubmitted ? 'badge-success' : 'badge-warning'}`}
              >
                {p.hasSubmitted ? '✓' : '⏳'} {p.name}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}
