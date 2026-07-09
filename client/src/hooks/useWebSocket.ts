import { useState, useRef, useCallback, useEffect } from 'react'
import type { GameState, ClientMessage, ServerMessage } from '@xuuuxi/shared'

const MAX_RECONNECT_DELAY = 30_000
const INITIAL_RECONNECT_DELAY = 1_000
const PING_INTERVAL = 25_000

export interface WebSocketState {
  connected: boolean
  gameState: GameState | null
  error: string | null
  send: (msg: ClientMessage) => void
  lastMessage: ServerMessage | null
}

export function useWebSocket(): WebSocketState {
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current)
      pingTimerRef.current = null
    }
  }, [])

  const startPing = useCallback(() => {
    if (pingTimerRef.current) clearInterval(pingTimerRef.current)
    pingTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }))
      }
    }, PING_INTERVAL)
  }, [])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg: ServerMessage = JSON.parse(event.data)
      setLastMessage(msg)

      switch (msg.type) {
        case 'ROOM_CREATED':
        case 'ROOM_JOINED':
        case 'GAME_STARTED':
        case 'GAME_STATE_UPDATE':
          setGameState(msg.gameState)
          setError(null)
          break

        case 'SETTINGS_UPDATED':
          setGameState(prev =>
            prev ? { ...prev, settings: msg.settings } : prev
          )
          break

        case 'PLAYER_JOINED':
          setGameState(prev => {
            if (!prev) return prev
            const exists = prev.players.some(p => p.id === msg.player.id)
            return {
              ...prev,
              players: exists
                ? prev.players.map(p => p.id === msg.player.id ? msg.player : p)
                : [...prev.players, msg.player],
            }
          })
          break

        case 'PLAYER_LEFT':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              players: prev.players.filter(p => p.id !== msg.playerId),
              me: msg.newHostId && prev.me.id === msg.newHostId
                ? { ...prev.me, isHost: true }
                : prev.me,
            }
          })
          break

        case 'PLAYER_SUBMITTED':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              players: prev.players.map(p =>
                p.id === msg.playerId ? { ...p, hasSubmitted: true } : p
              ),
            }
          })
          break

        case 'ALL_SUBMITTED':
          setGameState(prev =>
            prev ? { ...prev, phase: 'JUDGING', submissions: msg.submissions } : prev
          )
          break

        case 'PLAYER_VOTED':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              players: prev.players.map(p =>
                p.id === msg.playerId ? { ...p, hasVoted: true } : p
              ),
            }
          })
          break

        case 'ROUND_STARTED':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              phase: 'PLAYING',
              roundNumber: msg.roundNumber,
              currentBlackCard: msg.blackCard,
              me: {
                ...prev.me,
                hand: msg.hand,
                isJudge: prev.me.id === msg.judgeId,
                hasSubmitted: false,
                hasVoted: false,
              },
              players: prev.players.map(p => ({
                ...p,
                isJudge: p.id === msg.judgeId,
                hasSubmitted: false,
                hasVoted: false,
              })),
              submissions: [],
              revealedSubmissions: [],
            }
          })
          break

        case 'ROUND_RESULT':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              phase: 'ROUND_RESULT',
              revealedSubmissions: msg.revealedSubmissions,
              players: prev.players.map(p => ({
                ...p,
                score: msg.scores[p.id] ?? p.score,
              })),
              me: {
                ...prev.me,
                score: msg.scores[prev.me.id] ?? prev.me.score,
              },
            }
          })
          break

        case 'DISCARD_PHASE_STARTED':
          setGameState(prev =>
            prev ? { ...prev, phase: 'DISCARD_PHASE', canDiscard: true } : prev
          )
          break

        case 'CARDS_DISCARDED':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              canDiscard: false,
              me: {
                ...prev.me,
                hand: [
                  ...prev.me.hand.filter(c => msg.newCards.length > 0 ? true : true),
                  ...msg.newCards,
                ],
              },
            }
          })
          break

        case 'TRADE_OFFERED':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              trade: {
                status: 'PENDING_ACCEPTANCE',
                fromPlayerId: msg.fromPlayerId,
                toPlayerId: prev.me.id,
                fromPlayerReady: false,
                toPlayerReady: false,
              },
            }
          })
          break

        case 'TRADE_ACCEPTED':
          setGameState(prev =>
            prev ? { ...prev, trade: msg.trade } : prev
          )
          break

        case 'TRADE_REJECTED':
          setGameState(prev =>
            prev ? { ...prev, trade: { status: 'REJECTED', fromPlayerId: null, toPlayerId: null, fromPlayerReady: false, toPlayerReady: false } } : prev
          )
          break

        case 'TRADE_PARTNER_READY':
          setGameState(prev => {
            if (!prev?.trade) return prev
            return {
              ...prev,
              trade: { ...prev.trade, fromPlayerReady: true },
            }
          })
          break

        case 'TRADE_COMPLETE':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              trade: { status: 'COMPLETE', fromPlayerId: null, toPlayerId: null, fromPlayerReady: false, toPlayerReady: false },
              me: {
                ...prev.me,
                hand: [
                  ...prev.me.hand.filter(c => c.id !== msg.givenCardId),
                  msg.receivedCard,
                ],
              },
            }
          })
          break

        case 'TRADE_CANCELLED':
          setGameState(prev =>
            prev ? { ...prev, trade: null } : prev
          )
          break

        case 'GAME_OVER':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              phase: 'GAME_OVER',
              revealedSubmissions: msg.revealedSubmissions,
              players: prev.players.map(p => ({
                ...p,
                score: msg.finalScores[p.id] ?? p.score,
              })),
              me: {
                ...prev.me,
                score: msg.finalScores[prev.me.id] ?? prev.me.score,
              },
            }
          })
          break

        case 'PLAYER_KICKED':
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              players: prev.players.filter(p => p.id !== msg.playerId),
            }
          })
          break

        case 'YOU_WERE_KICKED':
          setGameState(null)
          setError('Has sido expulsado de la sala.')
          break

        case 'ROOM_DESTROYED':
          setGameState(null)
          setError(`La sala fue cerrada: ${msg.reason}`)
          break

        case 'ERROR':
          setError(msg.message)
          break

        case 'PONG':
          // Keepalive response — no action needed
          break
      }
    } catch {
      console.error('Failed to parse WebSocket message')
    }
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        setError(null)
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
        startPing()
      }

      ws.onmessage = handleMessage

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        clearTimers()
        // Schedule reconnect with exponential backoff
        const delay = reconnectDelayRef.current
        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY)
          connect()
        }, delay)
      }

      ws.onerror = () => {
        // onclose will fire after this; reconnection handled there
      }
    } catch {
      // Connection failed, onclose handler will trigger reconnect
    }
  }, [handleMessage, startPing, clearTimers])

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    } else {
      console.warn('WebSocket not connected, cannot send:', msg.type)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimers()
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect on intentional close
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect, clearTimers])

  return { connected, gameState, error, send, lastMessage }
}
