import { useState, useEffect } from 'react'
import { useGame } from '@/context/GameProvider'
import type { CollectionSummary, GameSettings } from '@xuuuxi/shared'
import { CrownIcon, Settings01Icon, PackageIcon, GameController01Icon, ViewIcon, Add01Icon, Delete01Icon, Copy01Icon, Tick01Icon } from 'hugeicons-react'
import { playSound } from '@/lib/sound'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible'
import { ArrowDown01Icon } from 'hugeicons-react'
import type { CollectionWithCards } from '@xuuuxi/shared'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function LobbyView() {
  const { gameState, updateSettings, startGame } = useGame()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)

  const [previewCollectionId, setPreviewCollectionId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<CollectionWithCards | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const [showCustomCardsModal, setShowCustomCardsModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [tempBlackText, setTempBlackText] = useState('')
  const [tempBlackPick, setTempBlackPick] = useState('1')
  const [tempWhiteText, setTempWhiteText] = useState('')

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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameState.roomCode)
      playSound('success')
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 1500)
    } catch {
      // Clipboard unavailable — the code is still visible to copy manually.
    }
  }

  const toggleCollection = (id: string) => {
    const current = settings.collectionIds
    const next = current.includes(id)
      ? current.filter(c => c !== id)
      : [...current, id]
    handleSettingChange({ collectionIds: next })
  }

  const handlePreview = (id: string) => {
    setPreviewCollectionId(id)
    setPreviewData(null)
    setLoadingPreview(true)
    fetch(`/api/collections/${id}`)
      .then(res => res.json())
      .then((data: CollectionWithCards) => {
        setPreviewData(data)
        setLoadingPreview(false)
      })
      .catch(() => {
        setLoadingPreview(false)
      })
  }

  const addCustomBlackCard = () => {
    if (!tempBlackText.trim()) return
    const current = settings.customBlackCards || []
    handleSettingChange({ customBlackCards: [...current, { text: tempBlackText.trim(), pick: parseInt(tempBlackPick, 10) }] })
    setTempBlackText('')
    setTempBlackPick('1')
  }

  const removeCustomBlackCard = (index: number) => {
    const current = [...(settings.customBlackCards || [])]
    current.splice(index, 1)
    handleSettingChange({ customBlackCards: current })
  }

  const addCustomWhiteCard = () => {
    if (!tempWhiteText.trim()) return
    const current = settings.customWhiteCards || []
    handleSettingChange({ customWhiteCards: [...current, { text: tempWhiteText.trim() }] })
    setTempWhiteText('')
  }

  const removeCustomWhiteCard = (index: number) => {
    const current = [...(settings.customWhiteCards || [])]
    current.splice(index, 1)
    handleSettingChange({ customWhiteCards: current })
  }

  return (
    <div className="lobby stagger-children">
      {/* Room Code */}
      <div className="lobby-code-section">
        <div className="lobby-code-label">Código de Sala</div>
        <button type="button" className="room-code-copy" onClick={handleCopyCode} title="Copiar código">
          <span className="room-code-display">{gameState.roomCode}</span>
          <span className="room-code-copy-hint">
            {copiedCode ? <><Tick01Icon size={14} /> Copiado</> : <><Copy01Icon size={14} /> Copiar código</>}
          </span>
        </button>
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
              <Input
                type="number"
                min={3}
                max={20}
                value={settings.handSize}
                onChange={e => handleSettingChange({ handSize: +e.target.value })}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Modo de juicio</label>
              <Select
                value={settings.judgingMode}
                onValueChange={(val: 'CZAR' | 'POPULAR_VOTE') => handleSettingChange({ judgingMode: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CZAR">Juez rotativo</SelectItem>
                  <SelectItem value="POPULAR_VOTE">Voto popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="settings-field">
              <label className="settings-label">Condición de victoria</label>
              <Select
                value={settings.winCondition}
                onValueChange={(val: 'POINTS' | 'ROUNDS') => handleSettingChange({ winCondition: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POINTS">Puntos</SelectItem>
                  <SelectItem value="ROUNDS">Rondas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.winCondition === 'POINTS' && (
              <div className="settings-field">
                <label className="settings-label">Puntos para ganar</label>
                <Input
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
                <Input
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
              <Input
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
              <Input
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
              <Input
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
              <Input
                type="number"
                min={0}
                max={300}
                value={settings.judgingTimerSeconds}
                onChange={e =>
                  handleSettingChange({ judgingTimerSeconds: +e.target.value })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Timer descarte (seg, 0=sin límite)</label>
              <Input
                type="number"
                min={0}
                max={300}
                value={settings.discardTimerSeconds}
                onChange={e =>
                  handleSettingChange({ discardTimerSeconds: +e.target.value })
                }
              />
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={settings.tradesEnabled}
                onChange={e =>
                  handleSettingChange({ tradesEnabled: e.target.checked })
                }
              />
              <span className="text-sm">Permitir intercambios entre jugadores</span>
            </label>
          </div>
        </div>
      )}

      {/* Collections */}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <PackageIcon size={20} /> Colecciones de Cartas
          </h3>
          {isHost && (
            <Button variant="secondary" size="sm" onClick={() => setShowCustomCardsModal(true)}>
              <Add01Icon size={16} className="mr-1" /> Cartas Extra
            </Button>
          )}
        </div>
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
                    className="w-4 h-4"
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(col.id);
                    }}
                    title="Previsualizar cartas"
                  >
                    <ViewIcon size={20} />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Start button */}
      {isHost ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            size="lg"
            className="w-full max-w-sm"
            onClick={startGame}
            disabled={!canStart}
          >
            <GameController01Icon size={24} className="mr-2" /> Empezar partida
          </Button>
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

      {/* Preview Dialog */}
      <Dialog open={!!previewCollectionId} onOpenChange={(open) => !open && setPreviewCollectionId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur border-border">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{previewData ? previewData.name : 'Cargando colección...'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto flex-1">
            {loadingPreview ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <span className="loading-spinner" />
              </div>
            ) : previewData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <DialogDescription>{previewData.description}</DialogDescription>
                
                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between h-auto py-2">
                      <h4 className="section-title" style={{ margin: 0 }}>Cartas Negras ({previewData.blackCards.length})</h4>
                      <ArrowDown01Icon size={20} className="collapsible-chevron opacity-50" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div style={{ padding: '1rem 0' }}>
                      <div className="card-submissions">
                        {previewData.blackCards.map(c => (
                          <div key={c.id} className="game-card black min-h-[140px]">
                            <div className="card-text text-sm">{c.text}</div>
                            {c.pick > 1 && <div className="card-meta">PICK {c.pick}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between h-auto py-2">
                      <h4 className="section-title" style={{ margin: 0 }}>Cartas Blancas ({previewData.whiteCards.length})</h4>
                      <ArrowDown01Icon size={20} className="collapsible-chevron opacity-50" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div style={{ padding: '1rem 0' }}>
                      <div className="card-submissions">
                        {previewData.whiteCards.map(c => (
                          <div key={c.id} className="game-card white min-h-[140px]">
                            <div className="card-text text-sm">{c.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <div className="error-message">Error al cargar la colección.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Cards Dialog */}
      <Dialog open={showCustomCardsModal} onOpenChange={setShowCustomCardsModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur border-border">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Cartas Extra (Solo para este juego)</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <DialogDescription>
                Añade cartas temporales que solo existirán durante esta partida. Ideal para bromas internas.
              </DialogDescription>

              <div>
                <h4 className="section-title">Cartas Negras</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Input
                    style={{ flex: 1 }}
                    placeholder="Texto de la carta negra..."
                    value={tempBlackText}
                    onChange={e => setTempBlackText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomBlackCard()}
                  />
                  <Select value={tempBlackPick} onValueChange={setTempBlackPick}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Pick" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Pick 1</SelectItem>
                      <SelectItem value="2">Pick 2</SelectItem>
                      <SelectItem value="3">Pick 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addCustomBlackCard}>Añadir</Button>
                </div>
                <div className="card-submissions">
                  {(settings.customBlackCards || []).map((c, i) => (
                    <div key={i} className="game-card black" style={{ position: 'relative', minHeight: '120px' }}>
                      <div className="card-text" style={{ fontSize: '1rem' }}>{c.text}</div>
                      {c.pick > 1 && <div className="card-meta">PICK {c.pick}</div>}
                      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2 hover:bg-white/20 text-white/70 hover:text-white" onClick={() => removeCustomBlackCard(i)}>
                        <Delete01Icon size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="section-title">Cartas Blancas</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Input
                    style={{ flex: 1 }}
                    placeholder="Texto de la carta blanca..."
                    value={tempWhiteText}
                    onChange={e => setTempWhiteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomWhiteCard()}
                  />
                  <Button onClick={addCustomWhiteCard}>Añadir</Button>
                </div>
                <div className="card-submissions">
                  {(settings.customWhiteCards || []).map((c, i) => (
                    <div key={i} className="game-card white" style={{ position: 'relative', minHeight: '120px' }}>
                      <div className="card-text" style={{ fontSize: '1rem' }}>{c.text}</div>
                      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => removeCustomWhiteCard(i)}>
                        <Delete01Icon size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
