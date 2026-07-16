import { useSyncExternalStore, useCallback } from 'react'
import { isMuted, setMuted, subscribeMuted } from '@/lib/sound'

/** Reactive access to the global sound mute preference. */
export function useSoundSettings() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => true)

  const toggleMuted = useCallback(() => {
    setMuted(!isMuted())
  }, [])

  return { muted, toggleMuted }
}
