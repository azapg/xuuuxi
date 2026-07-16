import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameProvider'
import { Door01Icon, Logout01Icon, Delete02Icon, Copy01Icon, Tick01Icon } from 'hugeicons-react'
import { playSound } from '@/lib/sound'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// The door icon in the top bar. Opens the room dialog: shareable code,
// game info, and exit controls — everything that used to live in a
// permanent sidebar, available on demand instead.
export default function RoomHeaderControls({ compact = false }: { compact?: boolean }) {
  const { gameState, leaveRoom, endRoom } = useGame()
  const [open, setOpen] = useState(false)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  if (!gameState) return null

  const isHost = gameState.me.isHost
  const settings = gameState.settings

  const handleLeave = () => {
    leaveRoom()
    setOpen(false)
    navigate('/')
  }

  const handleEnd = () => {
    endRoom()
    setOpen(false)
    navigate('/')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameState.roomCode)
      playSound('success')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable — the code is still visible to copy manually.
    }
  }

  const inGame = gameState.phase !== 'LOBBY'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setConfirmingEnd(false)
      }}
    >
      {compact ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          title={`Sala ${gameState.roomCode}`}
        >
          <Door01Icon size={18} />
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Door01Icon size={18} /> Sala {gameState.roomCode}
        </Button>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sala {gameState.roomCode}</DialogTitle>
          <DialogDescription>
            {isHost
              ? 'Eres el host de esta sala.'
              : 'Puedes salir de la sala cuando quieras.'}
          </DialogDescription>
        </DialogHeader>

        {/* Shareable code */}
        <button
          type="button"
          className="room-code-copy"
          onClick={handleCopy}
          title="Copiar código"
        >
          <span className="room-code-display" style={{ fontSize: '2rem' }}>
            {gameState.roomCode}
          </span>
          <span className="room-code-copy-hint">
            {copied ? <><Tick01Icon size={14} /> Copiado</> : <><Copy01Icon size={14} /> Copiar código</>}
          </span>
        </button>

        {/* Game info */}
        {inGame && (
          <div className="room-info-grid">
            <div className="room-info-item">
              <span className="room-info-label">Ronda</span>
              <span className="room-info-value">{gameState.roundNumber}</span>
            </div>
            <div className="room-info-item">
              <span className="room-info-label">Cartas restantes</span>
              <span className="room-info-value">{gameState.cardsRemaining}</span>
            </div>
            <div className="room-info-item">
              <span className="room-info-label">Modo</span>
              <span className="room-info-value">
                {settings.judgingMode === 'CZAR' ? 'Juez rotativo' : 'Voto popular'}
              </span>
            </div>
            <div className="room-info-item">
              <span className="room-info-label">Meta</span>
              <span className="room-info-value">
                {settings.winCondition === 'POINTS'
                  ? `${settings.pointsToWin} puntos`
                  : `${settings.totalRounds} rondas`}
              </span>
            </div>
          </div>
        )}

        {!confirmingEnd ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Button variant="secondary" className="w-full" onClick={handleLeave}>
              <Logout01Icon size={18} /> Salir de la Sala
            </Button>
            {isHost && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setConfirmingEnd(true)}
              >
                <Delete02Icon size={18} /> Terminar Sala (Todos)
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Esto cerrará la sala para todos los jugadores y no se puede deshacer. ¿Seguro?
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirmingEnd(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleEnd}>
                Sí, terminar sala
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
