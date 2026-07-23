import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { GAME_DISPLAY_NAME } from '@xuuuxi/shared'
import { useGame } from '@/context/GameProvider'
import { DiceIcon, Door01Icon, ArrowLeft01Icon, SparklesIcon } from 'hugeicons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Home() {
  const navigate = useNavigate()
  const { createRoom, joinRoom, gameState, error } = useGame()

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Navigate only right after explicitly submitting create/join from THIS
  // page (tracked via `loading`) — not just because stale gameState from an
  // old reconnect happens to exist. Otherwise landing on Home (e.g. via the
  // logo) while still technically a member of an old room would immediately
  // bounce you back into it.
  useEffect(() => {
    if (loading && gameState && gameState.roomCode) {
      navigate(`/room/${gameState.roomCode}`)
    }
  }, [gameState, loading, navigate])

  useEffect(() => {
    if (error) setLoading(false)
  }, [error])

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!playerName.trim()) return
      setLoading(true)
      createRoom(playerName.trim())
    },
    [playerName, createRoom],
  )

  const handleJoin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!playerName.trim() || !roomCode.trim()) return
      setLoading(true)
      joinRoom(roomCode.trim().toUpperCase(), playerName.trim())
    },
    [playerName, roomCode, joinRoom],
  )

  return (
    <div className="page-center">
      <div className="stagger-children" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {/* Title */}
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: 'var(--accent)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          {GAME_DISPLAY_NAME}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          El juego de cartas más irreverente
        </p>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button
              size="lg"
              className="w-full"
              onClick={() => setMode('create')}
            >
              <DiceIcon size={24} /> Crear Sala
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => setMode('join')}
            >
              <Door01Icon size={24} /> Unirse a Sala
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/prototypes">
                <SparklesIcon size={19} /> Explorar UI Lab
              </Link>
            </Button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Input
              type="text"
              placeholder="Tu nombre"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <Button
              size="lg"
              className="w-full"
              type="submit"
              disabled={!playerName.trim() || loading}
              isLoading={loading}
            >
              {!loading && <DiceIcon size={24} />} Crear Sala
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              type="button"
              onClick={() => { setMode('menu'); setLoading(false) }}
            >
              <ArrowLeft01Icon size={20} /> Volver
            </Button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Input
              type="text"
              placeholder="Código de sala"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '0.15em', fontWeight: 700 }}
              autoFocus
            />
            <Input
              type="text"
              placeholder="Tu nombre"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <Button
              size="lg"
              className="w-full"
              type="submit"
              disabled={!playerName.trim() || !roomCode.trim() || loading}
              isLoading={loading}
            >
              {!loading && <Door01Icon size={24} />} Unirse
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              type="button"
              onClick={() => { setMode('menu'); setLoading(false) }}
            >
              <ArrowLeft01Icon size={20} /> Volver
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
