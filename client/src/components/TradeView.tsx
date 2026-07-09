import { useState, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'
import { RefreshIcon, Tick01Icon, Cancel01Icon } from 'hugeicons-react'

export default function TradeView() {
  const { gameState, respondToTrade, selectTradeCard, cancelTrade } = useGame()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const trade = gameState?.trade
  if (!trade || trade.status === 'IDLE') return null

  const fromName = gameState?.players.find(p => p.id === trade.fromPlayerId)?.name ?? '???'
  const toName = gameState?.players.find(p => p.id === trade.toPlayerId)?.name ?? '???'

  const handleSelectCard = useCallback(() => {
    if (!selectedCardId) return
    selectTradeCard(selectedCardId)
    setSelectedCardId(null)
  }, [selectedCardId, selectTradeCard])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {/* PENDING_OFFER — Waiting for other player to accept */}
        {trade.status === 'PENDING_OFFER' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <RefreshIcon size={24} /> Intercambio Pendiente
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Esperando respuesta de <strong>{toName}</strong>...
            </p>
            <span className="loading-spinner" />
            <div style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={cancelTrade}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* PENDING_ACCEPTANCE — Other player wants to trade with you */}
        {trade.status === 'PENDING_ACCEPTANCE' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <RefreshIcon size={24} /> Oferta de Intercambio
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              <strong>{fromName}</strong> quiere intercambiar una carta contigo
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                className="btn btn-success btn-lg"
                onClick={() => respondToTrade(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Tick01Icon size={20} /> Aceptar
              </button>
              <button
                className="btn btn-danger btn-lg"
                onClick={() => respondToTrade(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Cancel01Icon size={20} /> Rechazar
              </button>
            </div>
          </div>
        )}

        {/* SELECTING_CARDS — Pick a card to trade */}
        {trade.status === 'SELECTING_CARDS' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <RefreshIcon size={24} /> Selecciona una Carta
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Elige la carta que quieres intercambiar
            </p>

            {/* Show partner readiness */}
            {(trade.fromPlayerReady || trade.toPlayerReady) && (
              <div className="info-message" style={{ marginBottom: '1rem' }}>
                Tu compañero ya seleccionó su carta
              </div>
            )}

            <div className="card-hand" style={{ maxHeight: '40vh', overflow: 'auto' }}>
              {gameState?.me.hand.map(card => (
                <div
                  key={card.id}
                  className={`game-card white selectable ${
                    selectedCardId === card.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedCardId(
                    selectedCardId === card.id ? null : card.id
                  )}
                >
                  <div className="card-text">{card.text}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={cancelTrade}>
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-lg"
                disabled={!selectedCardId}
                onClick={handleSelectCard}
              >
                Confirmar Intercambio
              </button>
            </div>
          </div>
        )}

        {/* COMPLETE — Trade done */}
        {trade.status === 'COMPLETE' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Tick01Icon size={24} /> ¡Intercambio Completado!
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Revisa tu nueva carta en tu mano
            </p>
            <button className="btn btn-primary" onClick={cancelTrade}>
              Cerrar
            </button>
          </div>
        )}

        {/* REJECTED */}
        {trade.status === 'REJECTED' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Cancel01Icon size={24} /> Intercambio Rechazado
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              El otro jugador no quiso intercambiar
            </p>
            <button className="btn btn-secondary" onClick={cancelTrade}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
