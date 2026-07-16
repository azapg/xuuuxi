import { useState, useEffect, useCallback } from 'react'
import { useGame } from '@/context/GameProvider'
import { useCardScale } from '@/hooks/useCardScale'
import { BalanceScaleIcon, CheckmarkBadge01Icon, Tick01Icon } from 'hugeicons-react'
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

// Judging uses the exact same stage + carousel interaction as card
// selection: the black card sits center stage, submissions riffle by in
// the carousel, and tapping one drops it onto the stage for comparison.
export default function JudgingView() {
  const { gameState, czarPick, vote } = useGame()
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBlackCardOnTop, setShowBlackCardOnTop] = useState(false)

  const { cardWidth, cardHeight, carouselHeight } = useCardScale()

  const isCzarMode = gameState?.settings.judgingMode === 'CZAR'
  const isJudge = gameState?.me.isJudge ?? false
  const hasVoted = gameState?.me.hasVoted ?? false

  // Reset selection when phase changes
  useEffect(() => {
    setSelectedSubmission(null)
    setIsSubmitting(false)
  }, [gameState?.phase])

  const canPick = isCzarMode && isJudge && !hasVoted
  const canVote = !isCzarMode && !isJudge && !hasVoted
  const canChoose = canPick || canVote

  const toggleSubmission = useCallback(
    (submissionId: string) => {
      if (!canChoose) return
      setSelectedSubmission(prev => {
        if (prev === submissionId) {
          playSound('cardLift')
          return null
        }
        playSound('cardSlide')
        return submissionId
      })
    },
    [canChoose],
  )

  const handleConfirm = useCallback(() => {
    if (!selectedSubmission || isSubmitting) return
    setIsSubmitting(true)
    playSound('success')
    if (canPick) {
      czarPick(selectedSubmission)
    } else if (canVote) {
      vote(selectedSubmission)
    }
  }, [selectedSubmission, canPick, canVote, czarPick, vote, isSubmitting])

  if (!gameState) return null

  const votedPlayers = gameState.players.filter(p => p.hasVoted)
  const totalVoters = isCzarMode ? 1 : gameState.players.filter(p => !p.isJudge).length
  const selected = gameState.submissions.find(s => s.submissionId === selectedSubmission)

  const statusMessage = canPick
    ? 'Elige la mejor respuesta'
    : canVote
      ? 'Vota por la mejor respuesta (no puedes votar por la tuya)'
      : hasVoted
        ? '¡Voto registrado! Esperando a los demás...'
        : 'El juez está eligiendo la mejor respuesta...'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* --- Center Stage: Black Card and Selected Submission --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '2.5rem', zIndex: 15 }}>

        {/* Phase badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
          <Badge variant="secondary" style={{ color: 'var(--accent)', background: 'var(--accent-subtle)' }}>
            {isCzarMode ? <><BalanceScaleIcon size={14} /> Juicio</> : <><CheckmarkBadge01Icon size={14} /> Votación</>}
          </Badge>
          <Badge variant="secondary" className="tabular-nums">
            {votedPlayers.length}/{totalVoters} votos
          </Badge>
        </div>

        {/* Stack Stage */}
        <div style={{ position: 'relative', width: cardWidth, height: cardHeight }}>
          {gameState.currentBlackCard && (
            <motion.div
              className="game-card black cursor-pointer"
              animate={{
                rotate: selected && !showBlackCardOnTop
                  ? -15 + (getDeterministicRandom(gameState.currentBlackCard.id) * 20 - 10)
                  : 0,
                scale: showBlackCardOnTop ? 1.05 : 1,
                zIndex: showBlackCardOnTop ? 50 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ width: cardWidth, height: cardHeight, position: 'absolute', top: 0, left: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              onHoverStart={() => {
                setShowBlackCardOnTop(true)
                playSound('cardHover')
              }}
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

          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.submissionId}
                initial={{ rotate: 0, y: 300, scale: 0.8, opacity: 0 }}
                animate={{
                  rotate: getDeterministicRandom(selected.submissionId) * 26 - 13,
                  x: getDeterministicRandom(selected.submissionId + 'x') * 28 - 14,
                  y: getDeterministicRandom(selected.submissionId + 'y') * 12 - 6,
                  scale: 1,
                  opacity: 1,
                }}
                exit={{ y: 300, scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.9 }}
                style={{ position: 'absolute', top: 0, left: 0, width: cardWidth, height: cardHeight, zIndex: 2 }}
              >
                <PlayingCard
                  layoutId={`submission-${selected.submissionId}`}
                  cards={selected.cards}
                  isSelected
                  onClick={() => toggleSubmission(selected.submissionId)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button / Messages */}
        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, position: 'relative' }}>
          <AnimatePresence mode="wait" initial={false}>
            {canChoose && selectedSubmission ? (
              <motion.div
                key="confirm-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button size="lg" isLoading={isSubmitting} onClick={handleConfirm}>
                  {isCzarMode ? <><BalanceScaleIcon size={20} /> Elegir Ganador</> : <><CheckmarkBadge01Icon size={20} /> Confirmar Voto</>}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="info-message"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {hasVoted && <Tick01Icon size={18} />}
                {statusMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Bottom Stage: Submissions Carousel --- */}
      <div style={{ width: '100%', paddingBottom: '1rem', zIndex: 10, marginTop: 'auto' }}>
        <CylinderCarousel itemSize={cardWidth} height={carouselHeight}>
          {gameState.submissions
            .filter(s => s.submissionId !== selectedSubmission)
            .map(sub => (
              <PlayingCard
                key={sub.submissionId}
                layoutId={`submission-${sub.submissionId}`}
                cards={sub.cards}
                onClick={canChoose ? () => toggleSubmission(sub.submissionId) : undefined}
              />
            ))}
        </CylinderCarousel>
      </div>
    </div>
  )
}
