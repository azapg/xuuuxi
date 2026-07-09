import { useGame } from '@/context/GameProvider'

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
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        🏆 Resultado de la Ronda {gameState.roundNumber}
      </h2>

      {/* Winner */}
      {winningSub && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="section-title" style={{ color: '#ffd700' }}>
            🎉 ¡{winningSub.playerName} gana esta ronda!
          </h3>

          {/* Winning combo: black + white */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {gameState.currentBlackCard && (
              <div className="game-card black winner" style={{ flex: '1 1 200px', maxWidth: 280 }}>
                <div className="card-text">{gameState.currentBlackCard.text}</div>
              </div>
            )}
            {winningSub.cards.map(card => (
              <div key={card.id} className="game-card white winner" style={{ flex: '1 1 200px', maxWidth: 280 }}>
                <div className="card-text">{card.text}</div>
              </div>
            ))}
          </div>

          {winningSub.votes > 0 && (
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {winningSub.votes} voto{winningSub.votes !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Other submissions */}
      {otherSubs.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="section-title">Otras respuestas</h3>
          <div className="card-submissions">
            {otherSubs.map(sub => (
              <div key={sub.submissionId} className="game-card white">
                {sub.cards.map((card, i) => (
                  <div
                    key={card.id}
                    className="card-text"
                    style={
                      i > 0
                        ? {
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--card-white-border)',
                          }
                        : undefined
                    }
                  >
                    {card.text}
                  </div>
                ))}
                <div className="card-meta">
                  {sub.playerName}
                  {sub.votes > 0 && ` · ${sub.votes} voto${sub.votes !== 1 ? 's' : ''}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade section */}
      {tradesEnabled && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="section-title">🔄 Intercambiar</h3>
          {tradablePlayers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No hay jugadores disponibles para intercambiar.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {tradablePlayers.map(p => (
                <button
                  key={p.id}
                  className="btn btn-secondary btn-sm"
                  onClick={() => offerTrade(p.id)}
                >
                  🔄 {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next round */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isHost ? (
          <button className="btn btn-primary btn-lg" onClick={nextRound}>
            ➡️ Siguiente Ronda
          </button>
        ) : (
          <div className="info-message">
            Esperando a que el host avance a la siguiente ronda...
          </div>
        )}
      </div>
    </div>
  )
}
