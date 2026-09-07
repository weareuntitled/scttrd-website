'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

export const LinkHubPreview: React.FC = () => {
  const fields = useFormFields(([formFields]) => ({
    handle: formFields['profile.handle']?.value as string,
    title: formFields['profile.title']?.value as string,
    description: formFields['profile.description']?.value as string,
    theme: formFields['appearance.theme']?.value as string,
    showUpcoming: formFields['appearance.showUpcoming']?.value as boolean,
    releaseUrl: formFields['featuredRelease.spotify']?.value as string,
  }))

  return (
    <aside className="link-hub-preview" aria-label="Vorschau Link Hub">
      <div className={`link-hub-preview__phone link-hub-preview__phone--${fields.theme || 'red'}`}>
        <div className="link-hub-preview__avatar">S</div>
        <strong>{fields.handle || '@scttrd_ofc'}</strong>
        <small>{fields.description || 'Profilbeschreibung'}</small>
        <div className="link-hub-preview__socials">spotify&nbsp;&nbsp; soundcloud&nbsp;&nbsp; instagram</div>
        <div className="link-hub-preview__release">{fields.releaseUrl ? 'Spotify Track ↗' : 'Spotify Track URL eintragen'}</div>
        {fields.showUpcoming !== false && <div className="link-hub-preview__section">UPCOMING SHOWS</div>}
        <div className="link-hub-preview__link">Spotify <span>↗</span></div>
        <div className="link-hub-preview__link">SoundCloud <span>↗</span></div>
        <div className="link-hub-preview__link">Instagram <span>↗</span></div>
      </div>
      <p>Live-Vorschau. Links und Shows kommen aus den jeweiligen Collections.</p>
      <style>{`
        .link-hub-preview { position: fixed; z-index: 20; top: 116px; right: 32px; width: 300px; }
        .link-hub-preview__phone { box-sizing: border-box; min-height: 520px; padding: 34px 18px 20px; border: 8px solid #111; border-radius: 32px; background: #f4f1ea; color: #111; text-align: center; box-shadow: 12px 12px 0 rgba(0, 0, 0, .16); font-family: Arial, sans-serif; }
        .link-hub-preview__phone--red { background: #f00000; }
        .link-hub-preview__phone--black { background: #151515; color: #fff; }
        .link-hub-preview__phone--white { background: #fff; }
        .link-hub-preview__avatar { display: grid; place-items: center; width: 72px; height: 72px; margin: 0 auto 16px; border: 2px solid currentColor; border-radius: 50%; font-size: 34px; font-weight: 900; }
        .link-hub-preview__phone strong { display: block; font-size: 22px; letter-spacing: -.06em; }
        .link-hub-preview__phone small { display: block; margin: 12px auto; font-size: 11px; line-height: 1.35; }
        .link-hub-preview__socials { margin: 18px 0 28px; font-size: 8px; font-weight: 900; text-transform: uppercase; }
        .link-hub-preview__section { margin: 0 0 8px; text-align: left; font-size: 9px; font-weight: 900; letter-spacing: .12em; }
        .link-hub-preview__release { display: flex; justify-content: space-between; align-items: center; margin: 0 0 10px; padding: 16px 12px; border: 2px solid currentColor; background: #111; color: #f4f1ea; font-size: 12px; font-weight: 900; text-align: left; }
        .link-hub-preview__link { display: flex; justify-content: space-between; margin-top: 8px; padding: 13px 12px; border: 1px solid currentColor; background: rgba(255, 255, 255, .72); font-size: 12px; font-weight: 900; text-align: left; }
        .link-hub-preview__phone--black .link-hub-preview__link { background: rgba(255, 255, 255, .08); }
        .link-hub-preview > p { margin: 12px 4px; color: var(--theme-elevation-500); font-size: 11px; line-height: 1.35; }
        @media (max-width: 1180px) { .link-hub-preview { display: none; } }
      `}</style>
    </aside>
  )
}
