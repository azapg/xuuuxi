import { useState, useEffect, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'
import { CrownIcon, Tick01Icon, HourglassIcon } from 'hugeicons-react'
import { CylinderCarousel } from './CylinderCarousel'
import { PlayingCard } from './PlayingCard'
import { motion, AnimatePresence } from 'motion/react'

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
    if (selectedIds.length !== pickCount || isSubmitting) return
    setIsSubmitting(true)
    submitCards(selectedIds)
  }, [selectedIds, pickCount, isSubmitting, submitCards])

  if (!gameState) return null

  // Players logic for the top bar
  const players = gameState.players;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* --- Top Bar: Minimal Room Info and Players --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', zIndex: 10 }}>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          {gameState.roomCode}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {players.map(p => {
            const initials = p.name.substring(0, 2).toUpperCase();
            return (
              <div 
                key={p.id}
                title={p.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  backgroundColor: p.isJudge ? 'var(--warning)' : (p.hasSubmitted ? 'var(--success)' : 'var(--bg-elevated)'),
                  color: p.isJudge || p.hasSubmitted ? '#fff' : 'var(--text-secondary)',
                  border: `2px solid ${p.hasSubmitted ? 'var(--success)' : 'var(--border)'}`,
                  position: 'relative'
                }}
              >
                {p.isJudge ? <CrownIcon size={16} /> : initials}
                
                {/* Status indicator badge */}
                {!p.isJudge && (
                  <div style={{ 
                    position: 'absolute', bottom: -4, right: -4, 
                    background: 'var(--bg-primary)', borderRadius: '50%', padding: 2
                  }}>
                    {p.hasSubmitted ? 
                      <Tick01Icon size={12} color="var(--success)" /> : 
                      <HourglassIcon size={12} color="var(--text-muted)" />
                    }
                  </div>
                )}
              </div>
            )
          })}
          
          {timerSeconds !== null && timerSeconds > 0 && (
            <div style={{ marginLeft: '1rem', fontWeight: 800, color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}>
              {timerSeconds}s
            </div>
          )}
        </div>
      </div>

      {/* --- Center Stage: Black Card and Selected Cards --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '3.5rem', zIndex: 5 }}>
        
        {/* Stack Stage */}
        <div style={{ position: 'relative', width: 180, height: 270, marginTop: '2rem' }}>
          
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
              style={{ width: 180, height: 270, position: 'absolute', top: 0, left: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
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
                    width: 180, 
                    height: 270, 
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
        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
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
              <motion.button 
                key="submit-btn"
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="btn btn-primary btn-lg" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Enviar {pickCount > 1 ? `(${selectedIds.length}/${pickCount})` : 'Carta'}
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Bottom Stage: Hand Carousel --- */}
      {!isJudge && !hasSubmitted && (
        <div style={{ width: '100%', paddingBottom: '1rem', zIndex: 10, marginTop: 'auto' }}>
          <CylinderCarousel itemSize={180} height={350}>
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
