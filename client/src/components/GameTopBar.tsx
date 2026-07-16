import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '@/context/GameProvider'
import { GAME_DISPLAY_NAME } from '@xuuuxi/shared'
import { CrownIcon, Tick01Icon, HourglassIcon, VolumeHighIcon, VolumeOffIcon } from 'hugeicons-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import ScoreboardView from './ScoreboardView'
import RoomHeaderControls from './RoomHeaderControls'
import { usePhaseTimer } from '@/hooks/usePhaseTimer'
import { useSoundSettings } from '@/hooks/useSoundSettings'

const MAX_VISIBLE_AVATARS = 5

// Compact overlay chrome for every in-room screen: a small logo, phase
// timer, sound toggle, and a player facepile that opens the full
// leaderboard. Everything else (room info, exit) lives behind the door
// icon so the play area keeps all the vertical space.
export function GameTopBar() {
  const { gameState } = useGame()
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const { muted, toggleMuted } = useSoundSettings()
  const timerSeconds = usePhaseTimer({ tick: true })

  if (!gameState) return null

  const players = gameState.players
  const visiblePlayers = players.slice(0, MAX_VISIBLE_AVATARS)
  const overflowCount = players.length - visiblePlayers.length

  return (
    <>
      <div className="game-topbar">
        <div className="game-topbar-left">
          <RoomHeaderControls compact />
          <Link to="/" className="game-topbar-brand">
            <span className="game-topbar-logo">{GAME_DISPLAY_NAME}</span>
            <span className="game-topbar-room-code">{gameState.roomCode}</span>
          </Link>
        </div>

        {timerSeconds != null && timerSeconds > 0 && (
          <div className={`game-topbar-timer ${timerSeconds <= 5 ? 'urgent' : ''}`}>
            {timerSeconds}s
          </div>
        )}

        <div className="game-topbar-right">
          <Button
            variant="ghost"
            size="icon-sm"
            silent={muted}
            onClick={toggleMuted}
            title={muted ? 'Activar sonido' : 'Silenciar'}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? <VolumeOffIcon size={18} /> : <VolumeHighIcon size={18} />}
          </Button>

          <button
            type="button"
            className="game-topbar-players"
            onClick={() => setLeaderboardOpen(true)}
            aria-label="Ver marcador completo"
          >
            {visiblePlayers.map((p, index) => {
              const initials = p.name.substring(0, 2).toUpperCase()
              return (
                <span
                  key={p.id}
                  className={`game-topbar-avatar ${p.isJudge ? 'judge' : ''}`}
                  style={{ zIndex: MAX_VISIBLE_AVATARS - index }}
                  title={p.name}
                >
                  {p.isJudge ? <CrownIcon size={14} /> : initials}
                  {!p.isJudge && (gameState.phase === 'PLAYING' || gameState.phase === 'JUDGING') && (
                    <span className="game-topbar-avatar-badge">
                      {(gameState.phase === 'PLAYING' ? p.hasSubmitted : p.hasVoted) ? (
                        <Tick01Icon size={10} color="var(--success)" />
                      ) : (
                        <HourglassIcon size={10} color="var(--text-muted)" />
                      )}
                    </span>
                  )}
                </span>
              )
            })}
            {overflowCount > 0 && (
              <span className="game-topbar-avatar game-topbar-avatar-overflow" style={{ zIndex: 0 }}>
                +{overflowCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcador — Sala {gameState.roomCode}</DialogTitle>
          </DialogHeader>
          <ScoreboardView />
        </DialogContent>
      </Dialog>
    </>
  )
}
