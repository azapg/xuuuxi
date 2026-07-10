import { useState, useEffect, useCallback } from 'react'
import type {
  CollectionSummary,
  CollectionWithCards,
  BlackCard,
  WhiteCard,
} from '@xuuuxi/shared'
import { PackageIcon, ArrowLeft01Icon, Cancel01Icon, PlusSignIcon } from 'hugeicons-react'

type ViewMode = 'list' | 'create' | 'detail'

export default function Collections() {
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>('list')
  const [selectedCollection, setSelectedCollection] =
    useState<CollectionWithCards | null>(null)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newLocale, setNewLocale] = useState('es-MX')

  // Add card form state
  const [newCardText, setNewCardText] = useState('')
  const [newCardType, setNewCardType] = useState<'black' | 'white'>('white')
  const [newCardPick, setNewCardPick] = useState(1)

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/collections')
      if (!res.ok) throw new Error('Error cargando colecciones')
      const data: CollectionSummary[] = await res.json()
      setCollections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const fetchCollectionDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/collections/${id}`)
      if (!res.ok) throw new Error('Error cargando colección')
      const data: CollectionWithCards = await res.json()
      setSelectedCollection(data)
      setView('detail')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }, [])

  const handleCreateCollection = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newName.trim()) return
      try {
        const res = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName.trim(),
            description: newDescription.trim(),
            locale: newLocale,
          }),
        })
        if (!res.ok) throw new Error('Error creando colección')
        setNewName('')
        setNewDescription('')
        setView('list')
        fetchCollections()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    },
    [newName, newDescription, newLocale, fetchCollections],
  )

  const handleAddCard = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedCollection || !newCardText.trim()) return
      try {
        const endpoint = `/api/collections/${selectedCollection.id}/cards`
        const body =
          newCardType === 'black'
            ? { black: [{ text: newCardText.trim(), pick: newCardPick }] }
            : { white: [{ text: newCardText.trim() }] }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Error agregando carta')
        setNewCardText('')
        // Reload the collection
        fetchCollectionDetail(selectedCollection.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    },
    [selectedCollection, newCardText, newCardType, newCardPick, fetchCollectionDetail],
  )

  const handleDeleteCard = useCallback(
    async (cardId: string, type: 'black' | 'white') => {
      if (!selectedCollection) return
      try {
        const endpoint = `/api/collections/${selectedCollection.id}/cards/${cardId}`
        const res = await fetch(endpoint, { method: 'DELETE' })
        if (!res.ok) throw new Error('Error eliminando carta')
        fetchCollectionDetail(selectedCollection.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    },
    [selectedCollection, fetchCollectionDetail],
  )

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PackageIcon size={24} /> Colecciones
        </h1>
        {view !== 'list' && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setView('list')
              setSelectedCollection(null)
              setError(null)
            }}
          >
            <ArrowLeft01Icon size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Volver
          </button>
        )}
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setError(null)}
          >
            <Cancel01Icon size={16} />
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <>
          <button
            className="btn btn-primary"
            style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setView('create')}
          >
            <PlusSignIcon size={20} /> Crear Colección
          </button>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <span className="loading-spinner" />
            </div>
          ) : collections.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>
              No hay colecciones. ¡Crea la primera!
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {collections.map(col => (
                <div
                  key={col.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => fetchCollectionDetail(col.id)}
                  onMouseEnter={e =>
                    (e.currentTarget.style.borderColor = 'var(--accent)')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.borderColor = 'var(--border)')
                  }
                >
                  <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
                    {col.name}
                  </h3>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {col.description || 'Sin descripción'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span className="badge badge-accent">
                      {col.blackCardCount} negras
                    </span>
                    <span className="badge badge-success">
                      {col.whiteCardCount} blancas
                    </span>
                  </div>
                  {col.isDefault && (
                    <span
                      className="badge badge-warning"
                      style={{ marginTop: '0.5rem' }}
                    >
                      Predeterminada
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE VIEW */}
      {view === 'create' && (
        <form
          onSubmit={handleCreateCollection}
          style={{
            maxWidth: 500,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h2 style={{ fontWeight: 700 }}>Crear Nueva Colección</h2>
          <div className="settings-field">
            <label className="settings-label">Nombre</label>
            <input
              className="input"
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Mi colección épica"
              required
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">Descripción</label>
            <textarea
              className="input"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Descripción de la colección..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">Idioma</label>
            <select
              value={newLocale}
              onChange={e => setNewLocale(e.target.value)}
            >
              <option value="es-MX">Español (México)</option>
              <option value="es-ES">Español (España)</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={!newName.trim()}>
            Crear
          </button>
        </form>
      )}

      {/* DETAIL VIEW */}
      {view === 'detail' && selectedCollection && (
        <div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>
            {selectedCollection.name}
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '2rem',
            }}
          >
            {selectedCollection.description || 'Sin descripción'}
          </p>

          {/* Add card form */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <h3 className="section-title">Agregar Carta</h3>
            <form
              onSubmit={handleAddCard}
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}
            >
              <div className="settings-field" style={{ flex: '1 1 200px' }}>
                <label className="settings-label">Texto</label>
                <input
                  className="input"
                  type="text"
                  value={newCardText}
                  onChange={e => setNewCardText(e.target.value)}
                  placeholder="Texto de la carta..."
                  required
                />
              </div>
              <div className="settings-field" style={{ flex: '0 0 120px' }}>
                <label className="settings-label">Tipo</label>
                <select
                  value={newCardType}
                  onChange={e =>
                    setNewCardType(e.target.value as 'black' | 'white')
                  }
                >
                  <option value="white">Blanca</option>
                  <option value="black">Negra</option>
                </select>
              </div>
              {newCardType === 'black' && (
                <div className="settings-field" style={{ flex: '0 0 80px' }}>
                  <label className="settings-label">Pick</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={3}
                    value={newCardPick}
                    onChange={e => setNewCardPick(+e.target.value)}
                  />
                </div>
              )}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!newCardText.trim()}
              >
                Agregar
              </button>
            </form>
          </div>

          {/* Black cards */}
          <div className="section">
            <h3 className="section-title">
              Cartas Negras ({selectedCollection.blackCards.length})
            </h3>
            {selectedCollection.blackCards.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sin cartas negras
              </p>
            ) : (
              <div className="card-submissions">
                {selectedCollection.blackCards.map((card: BlackCard) => (
                  <div key={card.id} className="game-card black">
                    <div className="card-text">{card.text}</div>
                    {card.pick > 1 && (
                      <span className="card-pick-badge">Pick {card.pick}</span>
                    )}
                    <div className="card-meta">
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          padding: '0.15rem 0.4rem',
                          fontSize: '0.7rem',
                          color: 'var(--error)',
                        }}
                        onClick={() => handleDeleteCard(card.id, 'black')}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* White cards */}
          <div className="section">
            <h3 className="section-title">
              Cartas Blancas ({selectedCollection.whiteCards.length})
            </h3>
            {selectedCollection.whiteCards.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sin cartas blancas
              </p>
            ) : (
              <div className="card-hand">
                {selectedCollection.whiteCards.map((card: WhiteCard) => (
                  <div key={card.id} className="game-card white">
                    <div className="card-text">{card.text}</div>
                    <div className="card-meta">
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          padding: '0.15rem 0.4rem',
                          fontSize: '0.7rem',
                          color: 'var(--error)',
                        }}
                        onClick={() => handleDeleteCard(card.id, 'white')}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
