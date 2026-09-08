'use client'

import React from 'react'

type LinkDoc = {
  id: string | number
  label?: string
  platform?: string
  url?: string
  cover?: string
  order?: number
}

const LINKS_URL = 'https://scttrd.de/links/'
const PLATFORMS = ['other', 'instagram', 'tiktok', 'spotify', 'soundcloud', 'youtube']

export const LinksPreviewPanel: React.FC = () => {
  const [links, setLinks] = React.useState<LinkDoc[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [label, setLabel] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [platform, setPlatform] = React.useState('other')
  const [status, setStatus] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

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
    if (!label.trim() || !url.trim()) {
      setStatus('Label und URL sind Pflicht')
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: label, label, url, platform }),
      })
      if (!response.ok) throw new Error(`${response.status}`)
      setStatus('Gespeichert ✓')
      setLabel('')
      setUrl('')
      setPlatform('other')
      load()
    } catch (err) {
      setStatus(`Fehler: ${err instanceof Error ? err.message : 'unbekannt'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="links-preview" aria-label="Vorschau + neuer Link">
      <div className="links-preview__box">
        <div className="links-preview__heading">Vorschau</div>
        <div className="links-preview__phone">
          {loading && <div className="links-preview__row">Lädt …</div>}
          {error && <div className="links-preview__error">API-Fehler: {error}</div>}
          {!loading && !error && links.length === 0 && (
            <div className="links-preview__row">Noch keine Links.</div>
          )}
          {!loading && !error && links.map((link) => (
            <a className="links-preview__row" key={link.id} href={link.url} target="_blank" rel="noreferrer">
              {link.cover ? <img src={link.cover} alt="" width="24" height="24" /> : null}
              <span>{link.label || link.url}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <a className="links-preview__link" href={LINKS_URL} target="_blank" rel="noreferrer">Live-Seite →</a>
      </div>

      <form className="links-add" onSubmit={add}>
        <div className="links-preview__heading">Neuer Link</div>
        <label>Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z. B. Spotify" />
        </label>
        <label>URL
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </label>
        <label>Plattform
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <button type="submit" disabled={saving}>{saving ? 'Speichert …' : 'Hinzufügen'}</button>
        {status && <p className="links-add__status">{status}</p>}
      </form>

      <style>{`
        .links-preview { display: grid; gap: 20px; }
        .links-preview__box { border: 1px solid var(--theme-elevation-150); border-radius: 8px; background: var(--theme-elevation-0); padding: 14px; }
        .links-preview__heading { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--theme-elevation-500); margin-bottom: 12px; }
        .links-preview__phone { display: flex; flex-direction: column; gap: 8px; }
        .links-preview__row { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border: 1px solid #2a2a2a; border-radius: 4px; background: #111; color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; }
        .links-preview__row img { width: 24px; height: 24px; object-fit: cover; border-radius: 2px; }
        .links-preview__row span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .links-preview__row:hover { background: #f00000; color: #000; }
        .links-preview__error { padding: 10px; background: #b00020; color: #fff; font-size: 12px; border-radius: 4px; }
        .links-preview__link { display: inline-block; margin-top: 12px; font-size: 12px; font-weight: 700; }
        .links-add { border: 1px solid var(--theme-elevation-150); border-radius: 8px; background: var(--theme-elevation-0); padding: 14px; display: grid; gap: 12px; }
        .links-add label { display: grid; gap: 5px; font-size: 12px; font-weight: 600; }
        .links-add input, .links-add select { padding: 8px 10px; border: 1px solid var(--theme-elevation-200); border-radius: 4px; font-size: 14px; }
        .links-add button { padding: 10px 12px; border: 0; border-radius: 4px; background: #f00000; color: #000; font-weight: 800; cursor: pointer; }
        .links-add button:disabled { opacity: .5; cursor: default; }
        .links-add__status { margin: 0; font-size: 12px; font-weight: 700; }
      `}</style>
    </div>
  )
}
