import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameProvider'
import { Door01Icon, Logout01Icon, Delete02Icon } from 'hugeicons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export default function RoomHeaderControls({ compact = false }: { compact?: boolean }) {
  const { gameState, leaveRoom, endRoom } = useGame()
  const [open, setOpen] = useState(false)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const navigate = useNavigate()

  if (!gameState) return null

  const isHost = gameState.me.isHost

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
