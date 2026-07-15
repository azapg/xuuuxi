import { useState, useEffect, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'
import { CylinderCarousel } from './CylinderCarousel'
import { PlayingCard } from './PlayingCard'
import { GameTopBar } from './GameTopBar'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from './ui/button'

// Simple deterministic random based on string to keep rotations stable
const getDeterministicRandom = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
};

export default function PlayingView() {
  const { gameState, submitCards } = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)

  const pickCount = gameState?.currentBlackCard?.pick ?? 1
  const isJudge = gameState?.me.isJudge ?? false
  const hasSubmitted = gameState?.me.hasSubmitted ?? false
  const hand = gameState?.me.hand ?? []
  const timer = gameState?.settings.submissionTimerSeconds ?? 0

  const [showBlackCardOnTop, setShowBlackCardOnTop] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Responsive scaling for mobile
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 800) {
        setScale(Math.max(0.65, window.innerHeight / 800))
      } else {
        setScale(1)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const cardWidth = Math.round(180 * scale)
  const cardHeight = Math.round(270 * scale)
  const carouselHeight = Math.round(350 * scale)

  // Reset selection on new round
  useEffect(() => {
    setSelectedIds([])
    setShowBlackCardOnTop(false)
    setIsSubmitting(false)
  }, [gameState?.roundNumber])

  // Reset submitting state if selection changes
  useEffect(() => {
    setIsSubmitting(false)
  }, [selectedIds])

  // Timer countdown
  useEffect(() => {
    const phaseEndsAt = gameState?.phaseEndsAt
    if (!phaseEndsAt) {
      setTimerSeconds(null)
      return
    }

    const calculateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000))
      return remaining
    }

    setTimerSeconds(calculateRemaining())
    
    const interval = setInterval(() => {
      const remaining = calculateRemaining()
      setTimerSeconds(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState?.phaseEndsAt])

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
    if (selectedIds.length !== pickCount || isSubmitting) return
    setIsSubmitting(true)
    submitCards(selectedIds)
  }, [selectedIds, pickCount, isSubmitting, submitCards])

  if (!gameState) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>

      <GameTopBar timerSeconds={timerSeconds} />

      {/* --- Center Stage: Black Card and Selected Cards --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '3.5rem', zIndex: 5 }}>
        
        {/* Stack Stage */}
        <div style={{ position: 'relative', width: cardWidth, height: cardHeight, marginTop: '2rem' }}>
          
          {/* Black card */}
          {gameState.currentBlackCard && (
            <motion.div 
              className="game-card black cursor-pointer" 
              initial={{ rotate: 0 }}
              animate={{ 
                rotate: selectedIds.length > 0 && !showBlackCardOnTop
                  ? -15 + (getDeterministicRandom(gameState.currentBlackCard.id) * 20 - 10) 
                  : 0,
                scale: showBlackCardOnTop ? 1.05 : 1,
                zIndex: showBlackCardOnTop ? 50 : 1
              }} // Random rotate around -15 when a card is selected
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              onHoverStart={() => setShowBlackCardOnTop(true)}
              onHoverEnd={() => setShowBlackCardOnTop(false)}
              onTap={() => setShowBlackCardOnTop(prev => !prev)}
            >
              <div className="card-text" style={{ fontSize: '1rem' }}>{gameState.currentBlackCard.text}</div>
              {gameState.currentBlackCard.pick > 1 && (
                <span className="card-pick-badge">
                  Elige {gameState.currentBlackCard.pick}
                </span>
              )}
            </motion.div>
          )}

          {/* Selected cards stage */}
          <AnimatePresence>
            {!isJudge && !hasSubmitted && selectedIds.map((id, index) => {
              const card = hand.find(c => c.id === id);
              if (!card) return null;
              
              const randAngle = getDeterministicRandom(id);
              const randX = getDeterministicRandom(id + 'x');
              const randY = getDeterministicRandom(id + 'y');
              
              // Randomly rotate and position slightly like a dropped card
              // Add a small offset based on index so multiple cards fan slightly
              const targetRotation = (randAngle * 26 - 13) + (index * 5); // Base random +/-13 deg, plus 5 deg per index
              const targetX = (randX * 28 - 14) + (index * 15); // Offset x for multiple cards
              const targetY = (randY * 12 - 6) + (index * 15); // Offset y for multiple cards
              
              return (
                <motion.div 
                  key={id} 
                  initial={{ rotate: 0, y: 300, scale: 0.8, opacity: 0 }}
                  animate={{ rotate: targetRotation, x: targetX, y: targetY, scale: 1, opacity: 1 }} 
                  exit={{ y: -600, scale: 0.5, opacity: 0, rotate: targetRotation + (randAngle > 0.5 ? 45 : -45) }}
                  transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.9 }}
                  style={{ 
                    position: 'absolute', 
                    top: 0, // Sit on top of the black card
                    left: 0, 
                    width: cardWidth, 
                    height: cardHeight, 
                    zIndex: 2 + index 
                  }}
                >
                  <PlayingCard 
                    layoutId={`card-${id}`} 
                    card={card} 
                    isSelected 
                    selectionIndex={index} 
                    pickCount={pickCount} 
                    onClick={() => toggleCard(id)} 
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Action Button / Messages */}
        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2rem', zIndex: 20 }}>
          <AnimatePresence mode="wait">
            {isJudge ? (
              <motion.div key="judge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="info-message">
                Eres el juez — espera las respuestas
              </motion.div>
            ) : hasSubmitted ? (
              <motion.div key="submitted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="info-message">
                ¡Cartas enviadas! Esperando a los demás...
              </motion.div>
            ) : selectedIds.length === pickCount ? (
              <motion.div
                key="submit-btn"
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button 
                  size="lg"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                >
                  Enviar {pickCount > 1 ? `(${selectedIds.length}/${pickCount})` : 'Carta'}
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Bottom Stage: Hand Carousel --- */}
      {!isJudge && !hasSubmitted && (
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
      )}
    </div>
  )
}
