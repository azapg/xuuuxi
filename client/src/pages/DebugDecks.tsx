import { useState, useEffect, useCallback } from 'react'
import type {
  CollectionSummary,
  CollectionWithCards,
  BlackCard,
  WhiteCard,
} from '@xuuuxi/shared'
import { PackageIcon, RefreshIcon, ShuffleIcon, PlayIcon, ArrowLeft01Icon } from 'hugeicons-react'
import { Link } from 'react-router-dom'

export default function DebugDecks() {
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [collection, setCollection] = useState<CollectionWithCards | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentBlackCard, setCurrentBlackCard] = useState<BlackCard | null>(null)
  const [currentHand, setCurrentHand] = useState<WhiteCard[]>([])
  const [autoFilledJoke, setAutoFilledJoke] = useState<{ black: BlackCard, whites: WhiteCard[] } | null>(null)

  // Fetch collections on mount
  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch('/api/collections')
        if (!res.ok) throw new Error('Error fetching collections')
        const data = await res.json()
        setCollections(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    fetchCollections()
  }, [])

  // Fetch specific collection when selected
  useEffect(() => {
    if (!selectedCollectionId) {
      setCollection(null)
      return
    }
    async function fetchCollection() {
      setLoading(true)
      try {
        const res = await fetch(`/api/collections/${selectedCollectionId}`)
        if (!res.ok) throw new Error('Error fetching collection details')
        const data = await res.json()
        setCollection(data)
        
        // Reset state
        setCurrentBlackCard(null)
        setCurrentHand([])
        setAutoFilledJoke(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchCollection()
  }, [selectedCollectionId])

  const getRandomItem = <T,>(arr: T[]): T | null => {
    if (arr.length === 0) return null
    return arr[Math.floor(Math.random() * arr.length)]
  }

  const getRandomItems = <T,>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  const handleRandomBlackCard = useCallback(() => {
    if (!collection) return
    setCurrentBlackCard(getRandomItem(collection.blackCards))
    setAutoFilledJoke(null)
  }, [collection])

  const handleShuffleHand = useCallback(() => {
    if (!collection) return
    setCurrentHand(getRandomItems(collection.whiteCards, 10))
  }, [collection])

  const handleAutoFill = useCallback(() => {
    if (!collection) return
    const black = getRandomItem(collection.blackCards)
    if (!black) return
    const whites = getRandomItems(collection.whiteCards, black.pick)
    setAutoFilledJoke({ black, whites })
    setCurrentBlackCard(null)
    setCurrentHand([])
  }, [collection])

  // Helper to format the joke
  const renderJoke = (black: BlackCard, whites: WhiteCard[]) => {
    if (black.text.includes('_____')) {
      let result = black.text
      whites.forEach((w) => {
        result = result.replace('_____', `<span style="color: var(--accent); font-weight: bold; text-decoration: underline;">${w.text}</span>`)
      })
      return <span dangerouslySetInnerHTML={{ __html: result }} />
    } else {
      // If no blanks, just append
      return (
        <span>
          {black.text} <br /><br />
          {whites.map(w => <span key={w.id} style={{color: 'var(--accent)', fontWeight: 'bold'}}>{w.text}<br/></span>)}
        </span>
      )
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PackageIcon size={24} /> Debug Decks
        </h1>
        <Link to="/" className="btn btn-ghost">
          <ArrowLeft01Icon size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Volver al Inicio
        </Link>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="settings-field" style={{ maxWidth: 400, marginBottom: '2rem' }}>
        <label className="settings-label">Seleccionar Colección</label>
        <select 
          value={selectedCollectionId} 
          onChange={(e) => setSelectedCollectionId(e.target.value)}
        >
          <option value="">-- Selecciona una colección --</option>
          {collections.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center' }}><span className="loading-spinner" /></div>}

      {collection && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleRandomBlackCard}>
              <RefreshIcon size={18} /> Random Black Card
            </button>
            <button className="btn btn-secondary" onClick={handleShuffleHand}>
              <ShuffleIcon size={18} /> Shuffle Hand (10)
            </button>
            <button className="btn btn-primary" onClick={handleAutoFill}>
              <PlayIcon size={18} /> Auto-fill Random Joke
            </button>
          </div>

          <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />

          {/* Auto-filled Joke Section */}
          {autoFilledJoke && (
            <div className="section">
              <h2 className="section-title">Generador Automático</h2>
              <div 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '2rem', 
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1.5rem',
                  lineHeight: '1.4',
                  border: '1px solid var(--border)'
                }}
              >
                {renderJoke(autoFilledJoke.black, autoFilledJoke.whites)}
              </div>
            </div>
          )}

          {/* Manual Debug Section */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Black Card */}
            <div style={{ flex: '1 1 300px' }}>
              <h3 className="section-title">Current Black Card</h3>
              {currentBlackCard ? (
                <div className="game-card black" style={{ transform: 'none', cursor: 'default' }}>
                  <div className="card-text">{currentBlackCard.text}</div>
                  {currentBlackCard.pick > 1 && (
                    <span className="card-pick-badge">Pick {currentBlackCard.pick}</span>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Ninguna carta negra seleccionada.</p>
              )}
            </div>

            {/* Hand */}
            <div style={{ flex: '2 1 500px' }}>
              <h3 className="section-title">Current Hand ({currentHand.length})</h3>
              {currentHand.length > 0 ? (
                <div className="card-hand">
                  {currentHand.map(card => (
                    <div key={card.id} className="game-card white" style={{ transform: 'none' }}>
                      <div className="card-text">{card.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Mano vacía.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
