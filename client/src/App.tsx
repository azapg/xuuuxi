import { Routes, Route, Link } from 'react-router-dom'
import { GAME_DISPLAY_NAME } from '@xuuuxi/shared'
import { GameProvider } from './context/GameProvider'
import Home from './pages/Home'
import Room from './pages/Room'
import Collections from './pages/Collections'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-logo">
          {GAME_DISPLAY_NAME}
        </Link>
      </header>
      <main className="app-main">
        <GameProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:code" element={<Room />} />
            <Route path="/collections" element={<Collections />} />
          </Routes>
        </GameProvider>
      </main>
    </div>
  )
}
