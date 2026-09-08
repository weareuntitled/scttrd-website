'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

const LINKS_URL = 'https://scttrd.de/links/';

type LinkDoc = {
  id: string | number
  label?: string
  platform?: string
  url?: string
  cover?: string
  order?: number
}

type ShowDoc = {
  id: string | number
  venue?: string
  city?: string
  date?: string
  status?: string
}

async function fetchDocs<T>(path: string): Promise<T[]> {
  const response = await fetch(path, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  const body = (await response.json()) as any
  return (body?.docs ?? []) as T[]
}

export const LinkHubPreview: React.FC = () => {
  const fields = useFormFields(([formFields]) => ({
    handle: formFields['profile.handle']?.value as string,
    title: formFields['profile.title']?.value as string,
    description: formFields['profile.description']?.value as string,
    theme: formFields['appearance.theme']?.value as string,
    showUpcoming: formFields['appearance.showUpcoming']?.value as boolean,
    releaseUrl: formFields['featuredRelease.spotify']?.value as string,
  }))

  const [links, setLinks] = React.useState<LinkDoc[] | null>(null)
  const [shows, setShows] = React.useState<ShowDoc[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all([fetchDocs<LinkDoc>('/api/links?sort=order&limit=100'), fetchDocs<ShowDoc>('/api/shows?limit=100')])
      .then(([linkDocs, showDocs]) => {
        if (cancelled) return
        setLinks(linkDocs)
        setShows(showDocs.filter((show) => show.status === 'upcoming').slice(0, 5))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const missing = [
    !fields.handle && 'Handle',
    !fields.title && 'Titel',
    !fields.description && 'Beschreibung',
    !fields.releaseUrl && 'Spotify-Track-URL',
  ].filter(Boolean) as string[];

  return (
    <aside className="link-hub-preview" aria-label="Vorschau Link Hub">
      <details className="link-hub-preview__box" open>
        <summary className="link-hub-preview__summary">Vorschau + Handy-Test</summary>
        <div className={`link-hub-preview__phone link-hub-preview__phone--${fields.theme || 'red'}`}>
          <div className="link-hub-preview__avatar">{(fields.handle || 'S').replace('@', '').slice(0, 1).toUpperCase()}</div>
          <strong>{fields.handle || '@scttrd_ofc'}</strong>
          <em>{fields.title || 'Titel fehlt'}</em>
          <small>{fields.description || 'Profilbeschreibung fehlt'}</small>
          <div className="link-hub-preview__socials">spotify&nbsp;&nbsp; soundcloud&nbsp;&nbsp; instagram</div>
          <div className="link-hub-preview__release">{fields.releaseUrl ? 'Spotify Track ↗' : 'Spotify Track URL eintragen'}</div>
          {fields.showUpcoming !== false && <div className="link-hub-preview__section">UPCOMING SHOWS</div>}
          {fields.showUpcoming !== false && shows === null && !error && (
            <div className="link-hub-preview__link">Shows laden …</div>
          )}
          {fields.showUpcoming !== false && (shows ?? []).map((show) => (
            <div className="link-hub-preview__link" key={show.id}>
              {[show.venue, show.city].filter(Boolean).join(' · ') || 'Show'} <span>↗</span>
            </div>
          ))}
          <div className="link-hub-preview__section">LINKS AUS DER COLLECTION</div>
          {links === null && !error && <div className="link-hub-preview__link">Links laden …</div>}
          {error && <div className="link-hub-preview__error">API-Fehler: {error}</div>}
          {(links ?? []).map((link) => (
            <div className="link-hub-preview__link" key={link.id}>
              {link.cover ? <img src={link.cover} alt="" width="20" height="20" /> : null}
              {link.label || link.url || 'Link ohne Label'} <span>↗</span>
            </div>
          ))}
          {links !== null && links.length === 0 && !error && (
            <div className="link-hub-preview__link">Noch keine Links — lege einen unter Links an.</div>
          )}
        </div>
        {missing.length > 0 && (
          <p className="link-hub-preview__warn">Noch fehlt: {missing.join(', ')}</p>
        )}
        <div className="link-hub-preview__qr">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(LINKS_URL)}`}
            alt="QR-Code zur Link-Hub-Seite"
            width="120"
            height="120"
            loading="lazy"
          />
          <div>
            <a href={LINKS_URL} target="_blank" rel="noreferrer">{LINKS_URL}</a>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Vorschau neu laden</button>
          </div>
        </div>
        <p>Live-Vorschau aus den Collections. Nach dem Speichern ggf. neu laden.</p>
      </details>
      <style>{`
        .link-hub-preview { position: fixed; z-index: 20; top: 116px; right: 32px; width: 300px; }
        .link-hub-preview__box { border: 1px solid var(--theme-elevation-150); border-radius: 8px; background: var(--theme-elevation-0); padding: 8px; }
        .link-hub-preview__summary { cursor: pointer; font-size: 12px; font-weight: 700; padding: 4px; }
        .link-hub-preview__phone { box-sizing: border-box; min-height: 480px; margin-top: 8px; padding: 34px 18px 20px; border: 8px solid #111; border-radius: 32px; background: #f4f1ea; color: #111; text-align: center; box-shadow: 12px 12px 0 rgba(0, 0, 0, .16); font-family: Arial, sans-serif; }
        .link-hub-preview__phone--red { background: #f00000; }
        .link-hub-preview__phone--black { background: #151515; color: #fff; }
        .link-hub-preview__phone--white { background: #fff; }
        .link-hub-preview__avatar { display: grid; place-items: center; width: 72px; height: 72px; margin: 0 auto 16px; border: 2px solid currentColor; border-radius: 50%; font-size: 34px; font-weight: 900; }
        .link-hub-preview__phone strong { display: block; font-size: 22px; letter-spacing: -.06em; }
        .link-hub-preview__phone em { display: block; font-size: 12px; font-style: normal; font-weight: 700; margin-top: 4px; }
        .link-hub-preview__phone small { display: block; margin: 12px auto; font-size: 11px; line-height: 1.35; }
        .link-hub-preview__socials { margin: 18px 0 28px; font-size: 8px; font-weight: 900; text-transform: uppercase; }
        .link-hub-preview__section { margin: 14px 0 8px; text-align: left; font-size: 9px; font-weight: 900; letter-spacing: .12em; }
        .link-hub-preview__release { display: flex; justify-content: space-between; align-items: center; margin: 0 0 10px; padding: 16px 12px; border: 2px solid currentColor; background: #111; color: #f4f1ea; font-size: 12px; font-weight: 900; text-align: left; }
        .link-hub-preview__link { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; padding: 13px 12px; border: 1px solid currentColor; background: rgba(255, 255, 255, .72); font-size: 12px; font-weight: 900; text-align: left; }
        .link-hub-preview__link img { width: 20px; height: 20px; object-fit: cover; }
        .link-hub-preview__phone--black .link-hub-preview__link { background: rgba(255, 255, 255, .08); }
        .link-hub-preview__error { margin-top: 8px; padding: 10px 12px; background: #b00020; color: #fff; font-size: 11px; font-weight: 700; text-align: left; }
        .link-hub-preview__warn { margin: 12px 4px 0; color: #b00020; font-size: 11px; font-weight: 700; }
        .link-hub-preview__qr { display: flex; gap: 12px; align-items: center; margin: 12px 4px 0; }
        .link-hub-preview__qr a { font-size: 11px; word-break: break-all; }
        .link-hub-preview__qr button { margin-top: 8px; font-size: 11px; cursor: pointer; }
        .link-hub-preview > details > p, .link-hub-preview__box > p { margin: 12px 4px; color: var(--theme-elevation-500); font-size: 11px; line-height: 1.35; }
        @media (max-width: 1180px) { .link-hub-preview { position: static; width: 100%; margin-bottom: 16px; } }
      `}</style>
    </aside>
  )
}
