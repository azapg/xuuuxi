import { Button } from '@/components/ui/button'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { GAME_DISPLAY_NAME } from '@xuuuxi/shared'
import { GameProvider, useGame } from './context/GameProvider'
import RoomHeaderControls from './components/RoomHeaderControls'
import Home from './pages/Home'
import Room from './pages/Room'
import Collections from './pages/Collections'
import DebugDecks from './pages/DebugDecks'
import Analytics from './pages/Analytics'

function AppShell() {
  const location = useLocation()
  const { gameState } = useGame()

  // During active card selection the game view renders its own compact
  // overlay chrome (logo + player list + room controls), so the global
  // header would just push content down for no reason on small screens.
  const isCompactGameView =
    location.pathname.startsWith('/room/') && gameState?.phase === 'PLAYING'

  return (
    <div className="app">
      {!isCompactGameView && (
        <header className="app-header">
          <Link to="/" className="app-logo">
            {GAME_DISPLAY_NAME}
          </Link>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <RoomHeaderControls />
            <Button asChild variant="ghost" size="sm">
              <Link to="/collections">
                Colecciones
              </Link>
            </Button>
            {import.meta.env.DEV && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/debug-decks">
                  Debug Decks
                </Link>
              </Button>
            )}
          </div>
        </header>
      )}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:code" element={<Room />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/analytics" element={<Analytics />} />
          {import.meta.env.DEV && (
            <Route path="/debug-decks" element={<DebugDecks />} />
          )}
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  )
}
