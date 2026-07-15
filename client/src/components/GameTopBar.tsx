import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '@/context/GameProvider'
import { GAME_DISPLAY_NAME } from '@xuuuxi/shared'
import { CrownIcon, Tick01Icon, HourglassIcon } from 'hugeicons-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import ScoreboardView from './ScoreboardView'

const MAX_VISIBLE_AVATARS = 5

// Compact overlay chrome for in-game screens (e.g. card selection): a small
// logo and a vertical player facepile that both sit at the same top offset,
// instead of a header bar that pushes the game content down.
export function GameTopBar({ timerSeconds }: { timerSeconds?: number | null }) {
  const { gameState } = useGame()
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

  if (!gameState) return null

  const players = gameState.players
  const visiblePlayers = players.slice(0, MAX_VISIBLE_AVATARS)
  const overflowCount = players.length - visiblePlayers.length

  return (
    <>
      <div className="game-topbar">
        <Link to="/" className="game-topbar-brand">
          <span className="game-topbar-logo">{GAME_DISPLAY_NAME}</span>
          <span className="game-topbar-room-code">{gameState.roomCode}</span>
        </Link>

        {timerSeconds != null && timerSeconds > 0 && (
          <div className="game-topbar-timer">{timerSeconds}s</div>
        )}

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
                {!p.isJudge && (
                  <span className="game-topbar-avatar-badge">
                    {p.hasSubmitted ? (
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
