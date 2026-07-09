import { useState, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'
import { Delete02Icon } from 'hugeicons-react'

export default function DiscardView() {
  const { gameState, discardCards } = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const maxDiscards = gameState?.settings.maxDiscards ?? 3
  const hand = gameState?.me.hand ?? []

  const toggleCard = useCallback(
    (cardId: string) => {
      setSelectedIds(prev => {
        if (prev.includes(cardId)) {
          return prev.filter(id => id !== cardId)
        }
        if (prev.length >= maxDiscards) return prev
        return [...prev, cardId]
      })
    },
    [maxDiscards],
  )

  const handleDiscard = useCallback(() => {
    if (selectedIds.length === 0) return
    discardCards(selectedIds)
  }, [selectedIds, discardCards])

  const handleSkip = useCallback(() => {
    discardCards([])
  }, [discardCards])

  if (!gameState) return null

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Delete02Icon size={24} /> Fase de Descarte
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Puedes descartar hasta {maxDiscards} carta{maxDiscards !== 1 ? 's' : ''} y
        recibir nuevas a cambio
      </p>

      <div className="card-hand">
        {hand.map(card => {
          const isSelected = selectedIds.includes(card.id)
          return (
            <div
              key={card.id}
              className={`game-card white selectable ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleCard(card.id)}
              style={
                isSelected
                  ? { borderColor: 'var(--error)', boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.2)' }
                  : undefined
              }
            >
              <div className="card-text">{card.text}</div>
              {isSelected && (
                <div className="card-meta" style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Delete02Icon size={16} /> Descartar
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <button className="btn btn-ghost btn-lg" onClick={handleSkip}>
          Saltar (quedarse con todo)
        </button>
        <button
          className="btn btn-danger btn-lg"
          onClick={handleDiscard}
          disabled={selectedIds.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Delete02Icon size={20} /> Descartar {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
        </button>
      </div>
    </div>
  )
}
