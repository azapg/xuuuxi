import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  GameState,
  GameSettings,
  ClientMessage,
  ServerMessage,
} from '@xuuuxi/shared'
import { useWebSocket } from '@/hooks/useWebSocket'

// ============================================================
// Context Shape
// ============================================================

interface GameContextValue {
  // State
  connected: boolean
  gameState: GameState | null
  error: string | null
  lastMessage: ServerMessage | null
  // Raw send
  send: (msg: ClientMessage) => void
  // Convenience actions
  createRoom: (playerName: string, settings?: Partial<GameSettings>) => void
  joinRoom: (roomCode: string, playerName: string) => void
  submitCards: (cardIds: string[]) => void
  vote: (submissionId: string) => void
  czarPick: (submissionId: string) => void
  offerTrade: (targetPlayerId: string) => void
  respondToTrade: (accept: boolean) => void
  selectTradeCard: (cardId: string) => void
  cancelTrade: () => void
  discardCards: (cardIds: string[]) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  startGame: () => void
  nextRound: () => void
  kickPlayer: (playerId: string) => void
  leaveRoom: () => void
  playAgain: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

// ============================================================
// Provider
// ============================================================

export function GameProvider({ children }: { children: ReactNode }) {
  const { connected, gameState, error, send, lastMessage } = useWebSocket()

  const createRoom = useCallback(
    (playerName: string, settings?: Partial<GameSettings>) => {
      send({ type: 'CREATE_ROOM', playerName, settings })
    },
    [send],
  )

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      send({ type: 'JOIN_ROOM', roomCode: roomCode.toUpperCase(), playerName })
    },
    [send],
  )

  const submitCards = useCallback(
    (cardIds: string[]) => send({ type: 'SUBMIT_CARDS', cardIds }),
    [send],
  )

  const vote = useCallback(
    (submissionId: string) => send({ type: 'VOTE', submissionId }),
    [send],
  )

  const czarPick = useCallback(
    (submissionId: string) => send({ type: 'CZAR_PICK', submissionId }),
    [send],
  )

  const offerTrade = useCallback(
    (targetPlayerId: string) =>
      send({ type: 'OFFER_TRADE', targetPlayerId }),
    [send],
  )

  const respondToTrade = useCallback(
    (accept: boolean) => send({ type: 'TRADE_RESPONSE', accept }),
    [send],
  )

  const selectTradeCard = useCallback(
    (cardId: string) => send({ type: 'TRADE_SELECT_CARD', cardId }),
    [send],
  )

  const cancelTrade = useCallback(
    () => send({ type: 'CANCEL_TRADE' }),
    [send],
  )

  const discardCards = useCallback(
    (cardIds: string[]) => send({ type: 'DISCARD_CARDS', cardIds }),
    [send],
  )

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) =>
      send({ type: 'UPDATE_SETTINGS', settings }),
    [send],
  )

  const startGame = useCallback(() => send({ type: 'START_GAME' }), [send])

  const nextRound = useCallback(() => send({ type: 'NEXT_ROUND' }), [send])

  const kickPlayer = useCallback(
    (playerId: string) => send({ type: 'KICK_PLAYER', playerId }),
    [send],
  )

  const leaveRoom = useCallback(() => send({ type: 'LEAVE_ROOM' }), [send])

  const playAgain = useCallback(() => send({ type: 'PLAY_AGAIN' }), [send])

  const value: GameContextValue = {
    connected,
    gameState,
    error,
    lastMessage,
    send,
    createRoom,
    joinRoom,
    submitCards,
    vote,
    czarPick,
    offerTrade,
    respondToTrade,
    selectTradeCard,
    cancelTrade,
    discardCards,
    updateSettings,
    startGame,
    nextRound,
    kickPlayer,
    leaveRoom,
    playAgain,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// ============================================================
// Hook
// ============================================================

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within a <GameProvider>')
  }
  return ctx
}
