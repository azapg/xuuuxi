import { useState, useCallback, useEffect } from 'react'
import { useGame } from '@/context/GameProvider'
import { RefreshIcon, Tick01Icon, Cancel01Icon } from 'hugeicons-react'
import { playSound } from '@/lib/sound'
import { PlayingCard } from './PlayingCard'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'

// Trades run inside the standard dialog so they open, close, and sound
// exactly like every other overlay in the game.
export default function TradeView() {
  const { gameState, respondToTrade, selectTradeCard, cancelTrade } = useGame()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trade = gameState?.trade

  useEffect(() => {
    setIsSubmitting(false)
  }, [trade?.status])

  const handleSelectCard = useCallback(() => {
    if (!selectedCardId || isSubmitting) return
    setIsSubmitting(true)
    playSound('success')
    selectTradeCard(selectedCardId)
    setSelectedCardId(null)
  }, [selectedCardId, selectTradeCard, isSubmitting])

  const handleRespond = useCallback((accept: boolean) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    respondToTrade(accept)
  }, [respondToTrade, isSubmitting])

  const handleCancel = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)
    cancelTrade()
  }, [cancelTrade, isSubmitting])

  const toggleCard = useCallback((cardId: string) => {
    setSelectedCardId(prev => {
      if (prev === cardId) {
        playSound('cardLift')
        return null
      }
      playSound('cardSlide')
      return cardId
    })
  }, [])

  if (!trade || trade.status === 'IDLE') return null

  const fromName = gameState?.players.find(p => p.id === trade.fromPlayerId)?.name ?? '???'
  const toName = gameState?.players.find(p => p.id === trade.toPlayerId)?.name ?? '???'

  const title =
    trade.status === 'PENDING_OFFER' ? 'Intercambio Pendiente'
    : trade.status === 'PENDING_ACCEPTANCE' ? 'Oferta de Intercambio'
    : trade.status === 'SELECTING_CARDS' ? 'Selecciona una Carta'
    : trade.status === 'COMPLETE' ? '¡Intercambio Completado!'
    : 'Intercambio Rechazado'

  const TitleIcon =
    trade.status === 'COMPLETE' ? Tick01Icon
    : trade.status === 'REJECTED' ? Cancel01Icon
    : RefreshIcon

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TitleIcon size={20} /> {title}
          </DialogTitle>
          {trade.status === 'PENDING_OFFER' && (
            <DialogDescription>
              Esperando respuesta de <strong>{toName}</strong>...
            </DialogDescription>
          )}
          {trade.status === 'PENDING_ACCEPTANCE' && (
            <DialogDescription>
              <strong>{fromName}</strong> quiere intercambiar una carta contigo
            </DialogDescription>
          )}
          {trade.status === 'SELECTING_CARDS' && (
            <DialogDescription>
              Elige la carta que quieres intercambiar
            </DialogDescription>
          )}
          {trade.status === 'COMPLETE' && (
            <DialogDescription>
              Revisa tu nueva carta en tu mano
            </DialogDescription>
          )}
          {trade.status === 'REJECTED' && (
            <DialogDescription>
              El otro jugador no quiso intercambiar
            </DialogDescription>
          )}
        </DialogHeader>

        {trade.status === 'PENDING_OFFER' && (
          <div style={{ textAlign: 'center' }}>
            <span className="loading-spinner" />
            <div style={{ marginTop: '1.5rem' }}>
              <Button variant="ghost" onClick={handleCancel} isLoading={isSubmitting}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {trade.status === 'PENDING_ACCEPTANCE' && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button
              variant="success"
              size="lg"
              onClick={() => handleRespond(true)}
              isLoading={isSubmitting}
            >
              <Tick01Icon size={20} /> Aceptar
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => handleRespond(false)}
              isLoading={isSubmitting}
            >
              <Cancel01Icon size={20} /> Rechazar
            </Button>
          </div>
        )}

        {trade.status === 'SELECTING_CARDS' && (
          <>
            {(trade.fromPlayerReady || trade.toPlayerReady) && (
              <div className="info-message">
                Tu compañero ya seleccionó su carta
              </div>
            )}

            <div className="card-hand" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {gameState?.me.hand.map(card => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  isSelected={selectedCardId === card.id}
                  onClick={() => toggleCard(card.id)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Button variant="ghost" onClick={handleCancel} isLoading={isSubmitting}>
                Cancelar
              </Button>
              <Button
                size="lg"
                disabled={!selectedCardId}
                isLoading={isSubmitting}
                onClick={handleSelectCard}
              >
                Confirmar Intercambio
              </Button>
            </div>
          </>
        )}

        {(trade.status === 'COMPLETE' || trade.status === 'REJECTED') && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant={trade.status === 'COMPLETE' ? 'default' : 'secondary'}
              onClick={handleCancel}
              isLoading={isSubmitting}
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
