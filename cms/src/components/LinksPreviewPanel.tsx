'use client'

import React from 'react'

type LinkDoc = {
  id: string | number
  title?: string
  label?: string
  platform?: string
  url?: string
  cover?: string
}

const LINKS_URL = 'https://scttrd.de/links/'

export const LinksPreviewPanel: React.FC = () => {
  const [links, setLinks] = React.useState<LinkDoc[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [url, setUrl] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const load = React.useCallback(async () => {
    try {
      const response = await fetch('/api/links?sort=order&limit=100', { credentials: 'same-origin' })
      if (!response.ok) throw new Error(`${response.status}`)
      const body = (await response.json()) as any
      setLinks(body?.docs ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = url.trim()
    if (!value) return
    if (!/^https?:\/\//i.test(value)) {
      setStatus('Bitte eine vollständige URL mit https:// angeben')
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value, platform: 'other' }),
      })
      if (!response.ok) throw new Error(`${response.status}`)
      setStatus('Gespeichert ✓')
      setUrl('')
      inputRef.current?.focus()
      load()
    } catch (err) {
      setStatus(`Fehler: ${err instanceof Error ? err.message : 'unbekannt'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="links-preview" aria-label="Links verwalten">
      <div className="links-preview__heading">Links — Linktree-artig einfügen</div>

      <form className="links-add" onSubmit={add}>
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… einfügen"
          aria-label="Link-URL einfügen"
        />
        <button type="submit" disabled={saving || !url.trim()}>
          {saving ? 'Fügt hinzu…' : 'Hinzufügen'}
        </button>
        <p className="links-add__hint">Titel &amp; Cover werden automatisch übernommen. Nach dem Hinzufügen kannst du direkt den nächsten einfügen.</p>
        {status && <p className="links-add__status">{status}</p>}
      </form>

      <div className="links-list">
        {loading && <div className="links-preview__row">Lädt …</div>}
        {error && <div className="links-preview__error">API-Fehler: {error}</div>}
        {!loading && !error && links.length === 0 && (
          <div className="links-preview__row links-preview__empty">Noch keine Links — füge oben eine URL ein.</div>
        )}
        {!loading && !error && links.map((link) => (
          <div className="links-list__row" key={link.id}>
            {link.cover ? <img src={link.cover} alt="" width="26" height="26" /> : null}
            <div className="links-list__body">
              <strong>{link.label || link.title || link.url}</strong>
              <span>{link.url}</span>
            </div>
            <a href={`/admin/collections/links/${link.id}`} aria-label={`${link.label || link.url} bearbeiten`}>✎</a>
          </div>
        ))}
      </div>

      <a className="links-preview__link" href={LINKS_URL} target="_blank" rel="noreferrer">Live-Seite →</a>

      <style>{`
        .links-preview { display: grid; gap: 14px; }
        .links-preview__heading { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--theme-elevation-500); }
        .links-add { display: grid; gap: 8px; }
        .links-add input { padding: 10px 12px; border: 1px solid var(--theme-elevation-200); border-radius: 4px; font-size: 14px; }
        .links-add button { padding: 11px 12px; border: 0; border-radius: 4px; background: #f00000; color: #000; font-weight: 800; cursor: pointer; }
        .links-add button:disabled { opacity: .5; cursor: default; }
        .links-add__hint { margin: 0; font-size: 11px; color: var(--theme-elevation-500); }
        .links-add__status { margin: 0; font-size: 12px; font-weight: 700; }
        .links-list { display: grid; gap: 6px; }
        .links-list__row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--theme-elevation-150); border-radius: 6px; background: var(--theme-elevation-0); }
        .links-list__row img { width: 26px; height: 26px; object-fit: cover; border-radius: 4px; flex: 0 0 auto; }
        .links-list__body { flex: 1; min-width: 0; display: grid; gap: 2px; }
        .links-list__body strong { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .links-list__body span { font-size: 11px; color: var(--theme-elevation-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .links-list__row > a { color: inherit; text-decoration: none; font-size: 14px; }
        .links-preview__row { padding: 10px; color: var(--theme-elevation-500); font-size: 13px; }
        .links-preview__empty { border: 1px dashed var(--theme-elevation-200); }
        .links-preview__error { padding: 10px; background: #b00020; color: #fff; font-size: 12px; border-radius: 4px; }
        .links-preview__link { font-size: 12px; font-weight: 700; }
      `}</style>
    </div>
  )
}
