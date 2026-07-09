import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GAME_DISPLAY_NAME } from '@xuuuxi/shared'
import { useGame } from '@/context/GameProvider'

export default function Home() {
  const navigate = useNavigate()
  const { createRoom, joinRoom, lastMessage, error } = useGame()

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Navigate when room is created or joined
  useEffect(() => {
    if (gameState && gameState.roomCode) {
      navigate(`/room/${gameState.roomCode}`)
    }
  }, [gameState, navigate])

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
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
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
          El juego de cartas más irreverente 🃏
        </p>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => setMode('create')}
            >
              🎲 Crear Sala
            </button>
            <button
              className="btn btn-secondary btn-lg btn-block"
              onClick={() => setMode('join')}
            >
              🚪 Unirse a Sala
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              className="input"
              type="text"
              placeholder="Tu nombre"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button
              className="btn btn-primary btn-lg btn-block"
              type="submit"
              disabled={!playerName.trim() || loading}
            >
              {loading ? <span className="loading-spinner" /> : '🎲 Crear Sala'}
            </button>
            <button
              className="btn btn-ghost btn-block"
              type="button"
              onClick={() => { setMode('menu'); setLoading(false) }}
            >
              ← Volver
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              className="input"
              type="text"
              placeholder="Código de sala"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '0.15em', fontWeight: 700 }}
              autoFocus
            />
            <input
              className="input"
              type="text"
              placeholder="Tu nombre"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <button
              className="btn btn-primary btn-lg btn-block"
              type="submit"
              disabled={!playerName.trim() || !roomCode.trim() || loading}
            >
              {loading ? <span className="loading-spinner" /> : '🚪 Unirse'}
            </button>
            <button
              className="btn btn-ghost btn-block"
              type="button"
              onClick={() => { setMode('menu'); setLoading(false) }}
            >
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
