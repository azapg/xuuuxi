import { useState, useEffect } from 'react'
import { useGame } from '@/context/GameProvider'
import type { CollectionSummary, GameSettings } from '@xuuuxi/shared'
import { CrownIcon, Settings01Icon, PackageIcon, GameController01Icon } from 'hugeicons-react'

export default function LobbyView() {
  const { gameState, updateSettings, startGame } = useGame()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)

  useEffect(() => {
    fetch('/api/collections')
      .then(res => res.json())
      .then((data: CollectionSummary[]) => {
        setCollections(data)
        setLoadingCollections(false)
      })
      .catch(() => setLoadingCollections(false))
  }, [])

  if (!gameState) return null

  const isHost = gameState.me.isHost
  const settings = gameState.settings
  const playerCount = gameState.players.length
  const canStart = playerCount >= settings.minPlayers

  const handleSettingChange = (partial: Partial<GameSettings>) => {
    updateSettings(partial)
  }

  const toggleCollection = (id: string) => {
    const current = settings.collectionIds
    const next = current.includes(id)
      ? current.filter(c => c !== id)
      : [...current, id]
    handleSettingChange({ collectionIds: next })
  }

  return (
    <div className="lobby">
      {/* Room Code */}
      <div className="lobby-code-section">
        <div className="lobby-code-label">Código de Sala</div>
        <div className="room-code-display">{gameState.roomCode}</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Comparte este código con tus amigos
        </p>
      </div>

      {/* Player List */}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <h3 className="section-title">
          Jugadores ({playerCount}/{settings.maxPlayers})
        </h3>
        <ul className="player-list">
          {gameState.players.map(p => (
            <li
              key={p.id}
              className={`player-item ${!p.isConnected ? 'disconnected' : ''}`}
            >
              <span className={`status-dot ${p.isConnected ? 'online' : 'offline'}`} />
              <span className="player-name">
                {p.name}
                {p.isHost && <CrownIcon size={16} style={{ verticalAlign: 'middle', marginLeft: '4px', color: 'var(--accent)' }} />}
                {p.id === gameState.me.id && ' (tú)'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Settings (host only) */}
      {isHost && (
        <div style={{ width: '100%', maxWidth: 500 }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings01Icon size={20} /> Configuración
          </h3>
          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label">Cartas en mano</label>
              <input
                className="input"
                type="number"
                min={3}
                max={20}
                value={settings.handSize}
                onChange={e => handleSettingChange({ handSize: +e.target.value })}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Modo de juicio</label>
              <select
                value={settings.judgingMode}
                onChange={e =>
                  handleSettingChange({
                    judgingMode: e.target.value as 'CZAR' | 'POPULAR_VOTE',
                  })
                }
              >
                <option value="CZAR">Juez rotativo</option>
                <option value="POPULAR_VOTE">Voto popular</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label">Condición de victoria</label>
              <select
                value={settings.winCondition}
                onChange={e =>
                  handleSettingChange({
                    winCondition: e.target.value as 'POINTS' | 'ROUNDS',
                  })
                }
              >
                <option value="POINTS">Puntos</option>
                <option value="ROUNDS">Rondas</option>
              </select>
            </div>

            {settings.winCondition === 'POINTS' && (
              <div className="settings-field">
                <label className="settings-label">Puntos para ganar</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={50}
                  value={settings.pointsToWin}
                  onChange={e => handleSettingChange({ pointsToWin: +e.target.value })}
                />
              </div>
            )}

            {settings.winCondition === 'ROUNDS' && (
              <div className="settings-field">
                <label className="settings-label">Total de rondas</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.totalRounds}
                  onChange={e =>
                    handleSettingChange({ totalRounds: +e.target.value })
                  }
                />
              </div>
            )}

            <div className="settings-field">
              <label className="settings-label">Descartar cada N rondas</label>
              <input
                className="input"
                type="number"
                min={0}
                max={20}
                value={settings.discardEveryNRounds}
                onChange={e =>
                  handleSettingChange({ discardEveryNRounds: +e.target.value })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Máx. descartes</label>
              <input
                className="input"
                type="number"
                min={0}
                max={10}
                value={settings.maxDiscards}
                onChange={e =>
                  handleSettingChange({ maxDiscards: +e.target.value })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Timer envío (seg, 0=sin límite)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={300}
                value={settings.submissionTimerSeconds}
                onChange={e =>
                  handleSettingChange({ submissionTimerSeconds: +e.target.value })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Timer juicio (seg, 0=sin límite)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={300}
                value={settings.judgingTimerSeconds}
                onChange={e =>
                  handleSettingChange({ judgingTimerSeconds: +e.target.value })
                }
              />
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.tradesEnabled}
                onChange={e =>
                  handleSettingChange({ tradesEnabled: e.target.checked })
                }
              />
              Permitir intercambios entre jugadores
            </label>
          </div>
        </div>
      )}

      {/* Collections */}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PackageIcon size={20} /> Colecciones de Cartas
        </h3>
        {loadingCollections ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <span className="loading-spinner" />
          </div>
        ) : collections.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No hay colecciones disponibles. Crea una en{' '}
            <a href="/collections" style={{ color: 'var(--accent)' }}>
              /collections
            </a>.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {collections.map(col => {
              const isSelected = settings.collectionIds.includes(col.id)
              return (
                <div
                  key={col.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: isHost ? 'pointer' : 'default',
                    opacity: isHost ? 1 : 0.7,
                  }}
                  onClick={() => isHost && toggleCollection(col.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{col.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {col.blackCardCount} negras · {col.whiteCardCount} blancas
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Start button */}
      {isHost ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={startGame}
            disabled={!canStart}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <GameController01Icon size={24} /> Iniciar Juego
          </button>
          {!canStart && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Se necesitan al menos {settings.minPlayers} jugadores
            </p>
          )}
        </div>
      ) : (
        <div className="info-message">
          Esperando a que el host inicie el juego...
        </div>
      )}
    </div>
  )
}
