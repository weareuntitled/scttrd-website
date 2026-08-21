# SCTTRD – Webflow-Look auf Headless-CMS umstellen (Final-PLAN)

Ziel: Den bestehenden statischen Webflow-Export **optisch so gut wie nötig 1:1** übernehmen
und die häufig geänderten Inhalte (Shows, Videos, Press, Links, About, Contact) über ein
**kostenloses Headless-CMS** editierbar machen. Babsi, Dani & Nate (2–3 Redakteure) pflegen
per **E-Mail-Login**; Agents pflegen dieselben **`.md`-Dateien** direkt im Repo.

> **Hauptregel:** Am Webflow-Look wird **nichts** neu designt. `css/`, `js/`, `images/`,
> `fonts/`, `videos/` werden **unverändert** übernommen. Wir ersetzen nur hartkodierte
> Inhaltswerte durch CMS-Renderings **derselben Markup-Struktur**.

---

## 1. Entscheidungen (GRILL-Ergebnis, verpflichtend)

| Thema | Entscheidung |
|-------|--------------|
| Stack | **Netlify + Decap CMS** (E-Mail-Login via Netlify Identity), build mit **Astro**, Inhalt = Git/`.md` |
| Login | 2–3 Redakteure per **Netlify Identity** (E-Mail-Einladung, kein GitHub-Konto) |
| Scope | **Alles** – Shows, Videos, Press, Links, About, Contact |
| Sprachen | **Teilbilingual** (Shows/Infos DE+EN), **kein** Sprachumschalter, Look bleibt |
| Presskit | **externer Link** (Kein Upload ins Repo) |
| Videos | im Repo, über CMS **austauschbar** |
| Booking | „Book us here"-Button → **mailto:info@scttrd.de** (kein Formular) |
| Analytics | **Plausible/Matomo** + **Cookie-Banner** (bewusste, leichte Look-Abweichung) |
| Domain | **bleibt bei GoDaddy** (Registrar), DNS zeigt auf Netlify + MX auf all-inkl |
| E-Mail | **all-inkl**, GoDaddy nur noch Domain-Registrar |
| Ziel-URL | `scttrd.de` behalten |
| Content-Menge | niedrig (<20 Shows/Jahr) → Free-Limits irrelevant |

---

## 2. Webflow-Style exakt übernehmen

- **Unverändert (100 %):** `css/normalize.css`, `webflow.css`, `scttrd-websitze.webflow.css`,
  `js/webflow.js`, alle `images/*`, `fonts/*`, `videos/*`, favicon, Inline-`<style>`-Block
  (Breakpoints `data-w-id`), alle `data-w-id`-/`w-node-*`-/Klassen. In `public/` kopiert.
- **Nur befüllt:** statische Listen-Werte (Venue, Stadt, Datum, Bild) → aus CMS,
  HTML-Struktur der `.customers-el`-Blöcke bleibt identisch.
- **Interactions:** `data-w-id` + `webflow.js` (Scroll-Einblendung, Cursor, Nav-Collapse)
  bleiben intakt → gerenderte Karten tragen dieselben Fingerprints.
- **Einzige Look-Abweichung (abgenommen):** ein schlankes Cookie-Banner-Script.

---

## 3. Content-Modell

| Collection | Dateien | Felder | Rendert in |
|-----------|---------|--------|-----------|
| `shows` | `content/shows/*.md` | `status` (upcoming/past), `venue`, `city`, `date`, `image`, optional `title_de`/`title_en` | `.customers-el`-Liste |
| `videos` | `content/videos/*.md` | `title`, `poster` (image), `video` (file im Repo), `order` | Video-Sektion |
| `press` | `content/press/*.md` | `title`, `cover` (image), `link` (extern, z.B. DRT/Drive), `date` | Press-Block / Link |
| `links` | `content/links/*.md` | `platform`, `label`, `url`, `order` | Nav (spotify/soundcloud/instagram), Footer |
| `about` | `content/about.md` (Singleton) | `bio_de`, `bio_en`, `email`, `text` | about.html / index-Bio |
| `contact` | `content/contact.md` (Singleton) | `email`, `address`, `text` | contacts.html |

- Bilder: Upload-Ordner `images/uploaded/`, werden mit-committet, Pfad-Relativierung `/images/...` wie im Export.
- Presskit: **nur JSON-Feld `link`** (externer URL), kein Upload – klein und einfach.

---

## 4. Stack-Handling

| Baustein | Wahl | Notiz |
|----------|------|-------|
| CMS | **Decap** (Netlify CMS) | git-basiert, Admin unter `/admin`, E-Mail-Login via Netlify Identity |
| Build | **Astro** | übernimmt die HTML/CSS als Basis, rendert Collections |
| Host | **Netlify** | Free, Git-Commit → auto-build → deploy; Netlify Identity (2–3 users) |
| E-Mail + MX | **all-inkl** | GoDaddy liefert nur noch die Domain |
| DNS | GoDaddy | A/ALIAS/CNAME → Netlify; MX + TXT → all-inkl |
| Analytics | Plausible (oder Matomo) | cookieless + Consent-Banner-Script |

---

## 5. Migrationsschritte

1. **Repo + Host:** Export-Ordner ins Git-Repo → auf Netlify deployen (sofort live, Pixel-identisch, noch ohne CMS).
2. **Statik nach `public/`:** css/js/images/fonts/videos 1:1.
3. **`Base.astro` + Seiten:** `<head>` samt `<style>` und `webflow.js`-Scripts wortgleich; Seiten bestehender Markup.
4. **Shows-Collection zuerst:** Schema + `content/shows/` + Render-Loop → bestehende 5 Shows als `.md` → Seite rendert identisch.
5. **Decap aktivieren:** `/admin`, Netlify-Identity, 2–3 E-Mail-Einladungen, Medien-Upload.
6. **Rest-Collections:** videos, press, links, about, contact (gleiche Logik).
7. **Book-Button:** `href="#"` → `mailto:info@scttrd.de?subject=Booking`.
8. **Analytics + Banner:** Plausible-Script + minimales Consent-Banner (einzige Look-Abweichung).
9. **E-Mail/Domain:** MX auf all-inkl; Domain bleibt bei GoDaddy; DNS zeigt auf Netlify; GoDaddy-E-Mail kündigen.

---

## 6. Definition of Done (Pixel-Parität)

- Neue Seite **nebeneinander** mit heutigem Export vergleichen (Screenshot, gleiche Viewport-Breite).
- CSS/JS/Fonts/Videos-Webressourcen exakt dieselben (Namen, Pfade).
- `data-w-id`/`w-node-*`/Klassen identisch in der Ausgabe.
- Alle Webflow-Interactions funktionieren.
- Babsi, Dani, Nate können via `/admin` Shows/Bilder ändern → Auto-Commit → Rebuild → live.
- Einzige beabsichtigte Abweichung: Cookie-Banner (abgenommen).

---

## 7. Sprachen (Teilbilingual, ohne Look-Anfassung)

- Kein Sprachumschalter, kein i18n-System.
- Ausgewählte Textfelder (Shows-Beschreibung, Bio) führen `_de`/`_en`-Felder; Anzeige folgt einem
  simplen `lang`-Attribut oder Standardwert. Rest bleibt wie heute.
- Aufwand: nur im Schema + den 2–3 editierbaren Blöcken, Look unberührt.

---

## 8. Kicker (bewusst später)

- „Block Poster / Veranstaltungs-Poster" → neue `poster`-Collection (Bild + Link), gleiche Mechanik.
- SEO/Meta-Tags aus CMS-Feldern.
- Alles andere bleibt statisch.