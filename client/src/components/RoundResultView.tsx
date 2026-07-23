import { useGame } from '@/context/GameProvider'
import { CrownIcon, PartyIcon, RefreshIcon, ArrowRight01Icon } from 'hugeicons-react'
import { motion } from 'motion/react'
import { PlayingCard } from './PlayingCard'
import { Button } from '@/components/ui/button'

const sectionStagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.1, type: 'spring' as const, stiffness: 300, damping: 26 },
})

export default function RoundResultView() {
  const { gameState, nextRound, offerTrade } = useGame()

  if (!gameState) return null

  const winningSub = gameState.revealedSubmissions.find(s => s.isWinner)
  const otherSubs = gameState.revealedSubmissions.filter(s => !s.isWinner)
  const isHost = gameState.me.isHost
  const tradesEnabled = gameState.settings.tradesEnabled

  const tradablePlayers = gameState.players.filter(
    p => p.id !== gameState.me.id && p.isConnected,
  )

  return (
    <div className="riot-result">
      <motion.h2
        {...sectionStagger(0)}
        style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textWrap: 'balance' }}
      >
        <CrownIcon size={24} /> Resultado de la Ronda {gameState.roundNumber}
      </motion.h2>

      {/* Winner */}
      {winningSub && (
        <motion.div {...sectionStagger(1)} style={{ marginBottom: '2rem' }}>
          <h3 className="section-title" style={{ color: '#ffd700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PartyIcon size={20} /> ¡{winningSub.playerName} gana esta ronda!
          </h3>

          {/* Winning combo: black + white */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {gameState.currentBlackCard && (
              <motion.div
                initial={{ opacity: 0, rotate: -4, scale: 0.92 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 22 }}
                className="game-card black winner"
                style={{ flex: '1 1 200px', maxWidth: 280 }}
              >
                <div className="card-text">{gameState.currentBlackCard.text}</div>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, rotate: 4, scale: 0.92 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 22 }}
              style={{ flex: '1 1 200px', maxWidth: 280, display: 'flex' }}
            >
              <PlayingCard
                cards={winningSub.cards}
                className="winner"
                meta={winningSub.votes > 0 ? `${winningSub.votes} voto${winningSub.votes !== 1 ? 's' : ''}` : undefined}
              />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Other submissions */}
      {otherSubs.length > 0 && (
        <motion.div {...sectionStagger(2)} style={{ marginBottom: '2rem' }}>
          <h3 className="section-title">Otras respuestas</h3>
          <div className="card-submissions">
            {otherSubs.map((sub, i) => (
              <motion.div
                key={sub.submissionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                style={{ display: 'flex' }}
              >
                <PlayingCard
                  cards={sub.cards}
                  meta={
                    <>
                      {sub.playerName}
                      {sub.votes > 0 && ` · ${sub.votes} voto${sub.votes !== 1 ? 's' : ''}`}
                    </>
                  }
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trade section */}
      {tradesEnabled && (
        <motion.div {...sectionStagger(3)} style={{ marginBottom: '2rem' }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshIcon size={20} /> Intercambiar
          </h3>
          {tradablePlayers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No hay jugadores disponibles para intercambiar.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {tradablePlayers.map(p => (
                <Button
                  key={p.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => offerTrade(p.id)}
                >
                  <RefreshIcon size={16} className="mr-2" /> {p.name}
                </Button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Next round */}
      <motion.div {...sectionStagger(4)} style={{ display: 'flex', justifyContent: 'center' }}>
        {isHost ? (
          <Button size="lg" onClick={nextRound}>
            <ArrowRight01Icon size={20} className="mr-2" /> Siguiente Ronda
          </Button>
        ) : (
          <div className="info-message">
            Esperando a que el host avance a la siguiente ronda...
          </div>
        )}
      </motion.div>
    </div>
  )
}
