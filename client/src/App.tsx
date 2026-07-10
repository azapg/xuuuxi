import { Button } from '@/components/ui/button'
import { Routes, Route, Link } from 'react-router-dom'
import { GAME_DISPLAY_NAME } from '@xuuuxi/shared'
import { GameProvider } from './context/GameProvider'
import Home from './pages/Home'
import Room from './pages/Room'
import Collections from './pages/Collections'
import DebugDecks from './pages/DebugDecks'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-logo">
          {GAME_DISPLAY_NAME}
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
      <main className="app-main">
        <GameProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:code" element={<Room />} />
            <Route path="/collections" element={<Collections />} />
            {import.meta.env.DEV && (
              <Route path="/debug-decks" element={<DebugDecks />} />
            )}
          </Routes>
        </GameProvider>
      </main>
    </div>
  )
}
