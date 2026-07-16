import { useState, useEffect } from 'react'

/**
 * Shared responsive card sizing for the stage + carousel game views, so
 * cards are the exact same size in every phase on every screen.
 */
export function useCardScale() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 800) {
        setScale(Math.max(0.65, window.innerHeight / 800))
      } else {
        setScale(1)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    scale,
    cardWidth: Math.round(180 * scale),
    cardHeight: Math.round(270 * scale),
    carouselHeight: Math.round(350 * scale),
  }
}
