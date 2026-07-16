import { useState, useEffect } from 'react'
import { useGame } from '@/context/GameProvider'
import { playSound } from '@/lib/sound'

/**
 * Seconds remaining in the current phase, derived from
 * `gameState.phaseEndsAt`. Returns null when the phase has no deadline.
 *
 * Pass `tick: true` from exactly ONE mounted component (the top bar) to get
 * a soft tick on each of the final five seconds.
 */
export function usePhaseTimer({ tick = false }: { tick?: boolean } = {}): number | null {
  const { gameState } = useGame()
  const phaseEndsAt = gameState?.phaseEndsAt
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!phaseEndsAt) {
      setSeconds(null)
      return
    }

    const remaining = () => Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000))

    setSeconds(remaining())
    const interval = setInterval(() => {
      const value = remaining()
      setSeconds(value)
      if (tick && value > 0 && value <= 5) playSound('tick')
      if (value <= 0) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [phaseEndsAt, tick])

  return seconds
}
