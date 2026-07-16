import { useEffect, useRef } from 'react'
import { useGame } from '@/context/GameProvider'
import { playSound } from '@/lib/sound'

/**
 * Plays event sounds in reaction to game state changes and server
 * messages. Mount exactly once while inside a room (the Room page).
 * Every audio cue here doubles a visual change the same update triggers.
 */
export function useGameSounds() {
  const { gameState, lastMessage } = useGame()
  const meId = gameState?.me.id
  const meIdRef = useRef(meId)
  meIdRef.current = meId

  // --- Phase transitions (the server broadcasts full state updates) ---
  const phase = gameState?.phase
  const roundNumber = gameState?.roundNumber
  const prevPhaseRef = useRef<string | undefined>(phase)
  const prevRoundRef = useRef<number | undefined>(roundNumber)

  useEffect(() => {
    const prevPhase = prevPhaseRef.current
    const prevRound = prevRoundRef.current
    prevPhaseRef.current = phase
    prevRoundRef.current = roundNumber
    if (!phase || phase === prevPhase) {
      // Same phase, but a new round of card selection still means new cards.
      if (phase === 'PLAYING' && roundNumber !== prevRound) playSound('deal')
      return
    }
    if (prevPhase === undefined) return // just joined — stay quiet

    switch (phase) {
      case 'PLAYING':
        playSound('deal')
        break
      case 'JUDGING':
        playSound('ready')
        break
      case 'ROUND_RESULT': {
        const winner = gameState?.revealedSubmissions.find(s => s.isWinner)
        playSound(winner && winner.playerId === meIdRef.current ? 'fanfare' : 'chime')
        break
      }
      case 'GAME_OVER': {
        playSound('fanfare')
        const top = gameState?.players.reduce(
          (best, p) => (p.score > best.score ? p : best),
          gameState.players[0],
        )
        if (top && top.id === meIdRef.current) {
          setTimeout(() => playSound('sparkle'), 450)
        }
        break
      }
      case 'DISCARD_PHASE':
        playSound('page')
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundNumber])

  // --- Point events (granular server messages) ---
  const handledRef = useRef<unknown>(null)

  useEffect(() => {
    if (!lastMessage || handledRef.current === lastMessage) return
    handledRef.current = lastMessage

    switch (lastMessage.type) {
      case 'PLAYER_JOINED':
        playSound('droplet')
        break
      case 'PLAYER_SUBMITTED':
      case 'PLAYER_VOTED':
        // Someone else's status badge just flipped — keep it barely there.
        if (lastMessage.playerId !== meIdRef.current) playSound('whisper')
        break
      case 'TRADE_OFFERED':
        playSound('chime')
        break
      case 'TRADE_COMPLETE':
        playSound('success')
        break
      case 'TRADE_REJECTED':
      case 'YOU_WERE_KICKED':
      case 'ROOM_DESTROYED':
      case 'ERROR':
        playSound('error')
        break
    }
  }, [lastMessage])
}
