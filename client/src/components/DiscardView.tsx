import { useState, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'
import { useCardScale } from '@/hooks/useCardScale'
import { Delete02Icon } from 'hugeicons-react'
import { motion, AnimatePresence } from 'motion/react'
import { CylinderCarousel } from './CylinderCarousel'
import { PlayingCard } from './PlayingCard'
import { playSound } from '@/lib/sound'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

// Simple deterministic random based on string to keep rotations stable
const getDeterministicRandom = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
};

// Discarding reuses the stage + carousel interaction: cards you tap fly
// up onto a marked discard zone, and the rest of the hand stays in the
// carousel below.
export default function DiscardView() {
  const { gameState, discardCards } = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { cardWidth, cardHeight, carouselHeight } = useCardScale()

  const maxDiscards = gameState?.settings.maxDiscards ?? 3
  const hand = gameState?.me.hand ?? []

  const handleSkip = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)
    discardCards([])
  }, [discardCards, isSubmitting])

  const handleDiscard = useCallback(() => {
    if (selectedIds.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    playSound('success')
    discardCards(selectedIds)
  }, [selectedIds, discardCards, isSubmitting])

  const toggleCard = useCallback(
    (cardId: string) => {
      if (isSubmitting) return
      setSelectedIds(prev => {
        if (prev.includes(cardId)) {
          playSound('cardLift')
          return prev.filter(id => id !== cardId)
        }
        if (prev.length >= maxDiscards) {
          playSound('error')
          return prev
        }
        playSound('cardSlide')
        return [...prev, cardId]
      })
    },
    [maxDiscards, isSubmitting],
  )

  if (!gameState) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* --- Center Stage: Discard Zone --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '2.5rem', zIndex: 15 }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
          <Badge variant="secondary" className="text-destructive bg-destructive/10">
            <Delete02Icon size={14} /> Fase de Descarte
          </Badge>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, textAlign: 'center', textWrap: 'balance' }}>
            Descarta hasta {maxDiscards} carta{maxDiscards !== 1 ? 's' : ''} y recibe nuevas a cambio
          </p>
        </div>

        {/* Discard zone stage */}
        <div className="discard-zone" style={{ position: 'relative', width: cardWidth, height: cardHeight }}>
          <div className="discard-zone-hint">
            <Delete02Icon size={28} />
            <span className="tabular-nums">{selectedIds.length}/{maxDiscards}</span>
          </div>

          <AnimatePresence>
            {selectedIds.map((id, index) => {
              const card = hand.find(c => c.id === id);
              if (!card) return null;

              const randAngle = getDeterministicRandom(id);

              return (
                <motion.div
                  key={id}
                  initial={{ rotate: 0, y: 300, scale: 0.8, opacity: 0 }}
                  animate={{
                    rotate: (randAngle * 26 - 13) + (index * 5),
                    x: (getDeterministicRandom(id + 'x') * 28 - 14) + (index * 12),
                    y: (getDeterministicRandom(id + 'y') * 12 - 6) + (index * 10),
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{ y: 300, scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.9 }}
                  style={{ position: 'absolute', top: 0, left: 0, width: cardWidth, height: cardHeight, zIndex: 2 + index }}
                >
                  <PlayingCard
                    layoutId={`card-${id}`}
                    card={card}
                    isSelected
                    selectionTone="destructive"
                    onClick={() => toggleCard(id)}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', zIndex: 200, position: 'relative' }}>
          <Button variant="ghost" onClick={handleSkip} isLoading={isSubmitting}>
            Saltar
          </Button>
          <AnimatePresence initial={false}>
            {selectedIds.length > 0 && (
              <motion.div
                key="discard-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleDiscard}
                  isLoading={isSubmitting}
                >
                  <Delete02Icon size={20} /> Descartar ({selectedIds.length})
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Bottom Stage: Hand Carousel --- */}
      <div style={{ width: '100%', paddingBottom: '1rem', zIndex: 10, marginTop: 'auto' }}>
        <CylinderCarousel itemSize={cardWidth} height={carouselHeight}>
          {hand.filter(c => !selectedIds.includes(c.id)).map(card => (
            <PlayingCard
              key={card.id}
              layoutId={`card-${card.id}`}
              card={card}
              onClick={() => toggleCard(card.id)}
            />
          ))}
        </CylinderCarousel>
      </div>
    </div>
  )
}
