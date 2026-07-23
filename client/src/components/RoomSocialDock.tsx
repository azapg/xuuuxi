import { FormEvent, useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { SentIcon } from 'hugeicons-react'
import type { RoomSocialEvent } from '@xuuuxi/shared'
import { useGame } from '@/context/GameProvider'
import { playSound } from '@/lib/sound'

const REACTIONS = ['🔥', '💀', '😳', '🍑', '🚩', '🤡', '🫦'] as const

export function RoomSocialDock() {
  const { lastMessage, sendReaction, sendRoomMessage } = useGame()
  const [message, setMessage] = useState('')
  const [events, setEvents] = useState<RoomSocialEvent[]>([])
  const seen = useRef(new Set<string>())
  const expiryTimers = useRef(new Map<string, number>())

  useEffect(() => {
    if (lastMessage?.type !== 'ROOM_SOCIAL_EVENT') return
    if (seen.current.has(lastMessage.event.id)) return
    seen.current.add(lastMessage.event.id)
    setEvents(current => [...current.slice(-1), lastMessage.event])
    const timeout = window.setTimeout(() => {
      setEvents(current => current.filter(event => event.id !== lastMessage.event.id))
      seen.current.delete(lastMessage.event.id)
      expiryTimers.current.delete(lastMessage.event.id)
    }, 4800)
    expiryTimers.current.set(lastMessage.event.id, timeout)
  }, [lastMessage])

  useEffect(() => () => {
    expiryTimers.current.forEach(timeout => window.clearTimeout(timeout))
  }, [])

  const react = (reaction: string) => {
    playSound('cardHover')
    sendReaction(reaction)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = message.trim()
    if (!clean) return
    playSound('cardSlide')
    sendRoomMessage(clean)
    setMessage('')
  }

  return (
    <aside className="riot-social" aria-label="Reacciones y mensajes">
      <AnimatePresence>
        {events.length > 0 && (
          <motion.div
            className="riot-social-feed"
            initial={{ opacity: 0, y: 18, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {events.map(event => (
              <div key={event.id} className={`riot-social-event ${event.kind.toLowerCase()}`}>
                <strong>{event.playerName}</strong>
                <span>{event.content}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="riot-reactions">
        {REACTIONS.map((reaction, index) => (
          <button
            key={reaction}
            type="button"
            onClick={() => react(reaction)}
            aria-label={`Enviar ${reaction}`}
            style={{ '--reaction-index': index } as CSSProperties}
          >
            <span>{reaction}</span>
          </button>
        ))}
      </div>

      <form className="riot-message-form" onSubmit={submit}>
        <input
          value={message}
          onChange={event => setMessage(event.target.value)}
          maxLength={72}
          placeholder="DI ALGO..."
          aria-label="Mensaje para la sala"
        />
        <button type="submit" disabled={!message.trim()} aria-label="Enviar mensaje">
          <SentIcon size={20} />
        </button>
      </form>
    </aside>
  )
}
