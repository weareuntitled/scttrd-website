# Plan — Show-Navigation Hub (80/20 Reflektor)

> Ein tiefes Modul-Cluster, das Menü (Shows / Links / Galerie), Logo-Erhalt und den „Next Show → Veranstaltungsseite“-Button mit maximaler Leverage hinter einer kleinen Interface bündelt. Grundlage: `CONTEXT.md` (Termin/Show, Bento, Hero, Galerie, Presse, CTA Video) + `DESIGN.md`.

## 1 · Ziel (ein Satz)

**Termin / Show** ist überall dieselbe Wahrheit: Menü-Punkte `Shows | Linkhub | Galerie` + Logo behalten, ein primärer Button `Next Show ↗` zeigt immer auf die **nächste** kommende **Termin / Show** — aber auf deren **Veranstaltungsseite** (`/shows/<slug>/`), nicht direkt auf den Ticket-Link.

## 2 · Ist-Zustand — warum kein Hub

| Ort | Was heute passiert | Friction |
|-----|-------------------|----------|
| `src/pages/index.astro:17-23` | `Termin.upcoming(shows)` + eigener `nextShow`-Filter `!NaN` + `sort(a,b => toTs(a)-toTs(b))` + `showSlug` → `/shows/<slug>/` | 4. Variante von Sortierung; löst bei `t.b.a.` anders auf als `links.astro`. |
| `src/pages/shows/[slug].astro:7-9` | `filter(status==='upcoming').sort((a,b)=>Termin.toTs(a)-Termin.toTs(b))[0]` + `showSlug` → `nextShowHref` (ohne NaN-Filter, ohne `order`-Fallback) | Duplikat zu `index.astro`, aber andere Semantik. |
| `src/pages/links.astro:7-14,28-35` | Eigener `parseShowDate` (T12:00:00) + Inline-`p()` (→ `0` bei ungültig) statt `Termin.toTs`; sort asc ohne `order` | Dritter Parser — `t.b.a.` landet vorn statt hinten. |
| Header | `index.astro:46-70` `.home-site-header` (Logo-Bild), `shows/[slug].astro:32-40` `.site-header` (Text-Marke), `gallery.astro:17-21` `.gallery-header` (flex, 2 Links), `links.astro` gar kein Nav, `styleguide.astro:15-21` sticky `site-nav` | 4 Header-Module, 0 Layout-**Seam** — jede Farb-/Breakpoint-Änderung = 3 Edits. |
| Soziale Filter | `index.astro:19` filtert auf `label`, `shows/[slug].astro:6` auf `platform`, `links.astro:19` zusätzlich `youtube` | Gleicher Filter, 3 Schreibweisen. |
| Identität | `src/lib/cms.ts:8` `showSlug` wohnt im CMS-**Module**, obwohl rein domain | Reine Funktion zieht CMS-**Seam** (`fetch`, `PAYLOAD_URL`) als Abhängigkeit. |
| Ort | Datei oder Inline | Verbrauchert : Bento/Hero als Analogie — kleine **Module** mit großen **Interface**-Leak. |

Deletion-Test: Löscht man `src/lib/termin.js` oder `showSlug`, taucht die Komplexität nicht weg — sie erscheint an 3–4 Call-Sites mit divergenten Fallbacks wieder. → Das **Modul** sollte tief sein, ist aber flach.

## 3 · Soll-Architektur — ein Hub, zwei Module

### 3.1 Domänen-Module `Termin / Show` (tief, 80 % der Leverage)

**Seam:** `src/lib/show.ts` (neu) — einziger Ort, der deutsches Datum versteht.

**Interface (klein, bewusst):**

```ts
// Eingabe: CollectionEntry<'shows'> (Zod in src/content.config.ts:8-24) oder CMS-Doc mit {venue,city,date,status,order,link}
// Kein neuer Begriff — alles bleibt Termin / Show aus CONTEXT.md
parseDate(raw: string)           // "21.08.2026" | "t.b.a." → Date | null  (ersetzt toTs + parseShowDate + p())
formatDate(raw: string)          // → "21.08.2026" (kanonisch, DESIGN.md Meta)
compareByDate(a,b)               // byDate + order-Fallback, stabil für NaN→hinten
upcoming(shows) / past(shows)    // filter + compareByDate (ersetzt 3 Varianten)
nextShow(shows)                  // früheste upcoming (asc), null bei leer/t.b.a.-only — nutzt upcoming() intern
showSlug(venue,date)             // umgezogen aus cms.ts:8
showUrl(show)                    // `/shows/<slug>/`  — einzige Stelle, die den Template-String kennt
showAction(show)                 // { href, label, kind } — kapselt DESIGN.md:96-103 (youtube→Video, sonst Veranstaltungsseite) + Ticket-Erkennung; aber: nextShow-Button nutzt immer showUrl, nicht action.href
```

**Implementation:** Reine Funktionen, kein `fetch`, kein `fs`. Interne **Seams** (z. B. Datums-Regex) bleiben privat — nicht Teil der **Interface**. Bestehendes `src/lib/termin.js:1-19` geht in diesem **Modul** auf (Migration, kein Bruch).

**Adapter:** Keine — nur ein **Modul** mit einer **Interface**. Erster echter **Seam** entsteht später, wenn ein zweiter Datumslieferant dazukommt (z. B. CMS liefert `Date` statt `string`).

### 3.2 Layout-/Navigations-Module (Rest der 80/20)

**Seam 1 — `src/layouts/BaseLayout.astro`** (neu, einzige Layout-**Seam** im Projekt — heute `src/layouts/` existiert nicht)
- Props: `{ title, description, nextShowHref?, currentPath }` — klein.
- Rendert `<html lang="de">`, Fonts, `tokens.css`, Footer; **spannt** Header als Slot/Prop.

**Seam 2 — `src/components/SiteHeader.astro`** (neu)
- Props: `{ nextShowUrl: string | null, socialLinks: Link[] }`
- Rendert: Logo (`Frame-179-2.png` — erhalten), Nav `Shows → #shows` (auf `/` Anker, sonst `/#shows`), `Links → /links/`, `Galerie → /gallery/`, rechts `Next Show ↗ → nextShowUrl` (Veranstaltungsseite, `target` nur bei extern — intern immer `_self`).
- Keine eigene Daten-Fetch — bekommt `socialLinks` gefiltert vom Hub (ein Filter statt drei).
- Styling: zieht `DESIGN.md:11` Tokens (`#f00000`/`#0c0c0c`, `5px 5px 0` Shadow, Radius 0) — nicht 4× dupliziert.

**Warum zwei Module als ein Hub:** Der Show-Hub liefert `nextShowUrl` + `socialLinks`; die Layout-**Seam** konsumiert sie. Ohne Hub bliebe der Header ein shallow Pass-Through (nur Markup). Mit Hub steckt echte Entscheidung (welche Show ist „nächste"?) hinter einer 2-Prop-**Interface**.

## 4 · Warum 80/20

- **Leverage:** Eine Änderung am Menü (z. B. `Links` ↔ `Galerie` Reihenfolge) zahlt sich an 4 Seiten + mobilem Breakpoint aus. Eine Änderung an `t.b.a.`-Sortierung zahlt sich an `index`, `shows/[slug]` und `links` gleichzeitig aus.
- **Locality:** Ticket-Funnel-Entscheidung („Button immer zur Veranstaltungsseite") liegt nicht mehr in `index.astro:23` *und* `shows/[slug].astro:8` *und* Inline-Regex `links.astro:86`, sondern in `showAction` / `nextShow`.
- **Messbar:** Heute: Menü ändern = 3 Dateien + 2 Regex-Stellen + 1 Sort-Richtung. Nachher: 1 Datei (`SiteHeader.astro`) + 1 Funktion (`nextShow`).

## 5 · Schritte (Reihenfolge respektiert Abhängigkeiten)

**Phase 0 — CONTEXT.md härten (5 Min, kein Code):**
- Begriff „Links / Galerie“ ist heute implizit. In `CONTEXT.md` ergänzen:
  `| Links | Link-Hub auf /links/ | — |`
  `| Galerie | Bild-Liste auf /gallery | Fallback Pages(slug=about).gallery |`
  Datei lazy anlegen falls fehlend — hier existiert sie, nur erweitern.
- Falls `showUrl` als neuer domänensprachlicher Begriff gewünscht, ebenfalls aufnehmen (entscheidet der Grill).

**Phase 1 — Show-Hub vertiefen (größter Hebel, ~60 %):**
1. `src/lib/show.ts` neu — portiert `termin.js:1-19` + `cms.ts:8-12` + vereinheitlicht `links.astro:28-35` + `links.astro:10` + `index.astro:20-23` + `shows/[slug].astro:7`.
2. `src/lib/termin.js` als Re-Export-Shim behalten (`export * from './show.ts'`) oder per Codemod entfernen — kein Bruch für `tests/termin.test.mjs:3`.
3. `src/lib/cms.ts` entkoppeln: `showSlug`-Import auf `show.ts` umbiegen (oder ganz entfernen, weil `getShows:61,76` intern über `show.ts` dedupt).
4. Tests: `tests/termin.test.mjs:22-31` erweitern um `nextShow` + `t.b.a.`-Fälle; neuer Test `showUrl`/`showSlug` kollisionsfrei.

**Phase 2 — Header/Layout entduplizieren (restliche 20 % der 80/20):**
5. `src/components/SiteHeader.astro` neu — übernimmt `index.astro:46-70` + `shows/[slug].astro:32-40` + `gallery.astro:17-21`.
6. `src/layouts/BaseLayout.astro` neu — zieht `<head>`, Tokens, Webflow-CSS-Imports (bleiben vorerst), Footer dorthin. `gallery.astro` + `styleguide.astro` behalten ihr spezielles Styling als Slot, verlieren aber den duplizierten Header.
7. Menü fix verdrahten: `Shows` (href `#shows` bzw. `/#shows` wenn nicht `/`), `Links` (`/links/`), `Galerie` (`/gallery/`). Logo bleibt `Frame-179-2.png`.
8. `Next Show ↗` Button: `href = showUrl(nextShow(shows))` — immer Veranstaltungsseite, nie direkt Ticket-Link. Auf `links.astro` behält jede Show-Zeile zusätzlich den roten `Tickets ↗` Chip (direkt zum Ticket), aber der Header-Button führt zur Seite — wie gefordert.

**Phase 3 — Aufräumen (optional, nach 1+2):**
9. `src/lib/bento.js:1-9` vs `index.astro:102-120` — nur wenn Phase 1+2 grün: `bento.js` als tiefes **Bento**-**Modul** vervollständigen (heute dead code, Deletion-Test besteht).
10. `src/lib/media.js:3-4` `fs.existsSync` — nur Build-time, nicht runtime (heute unbenutzt). Separat entscheiden.

## 6 · Interface-Skizze (noch kein finaler Typ — Grill entscheidet)

```
# SiteHeader
Props { nextShowUrl: string|null } (keine Socials — nur Linkhub-Menüpunkt)
Rendert: [Logo] [Shows] [Linkhub] [Galerie] ... [Next Show ↗]
Layout: Flex-Zonen (Logo | Nav links | Next rechts), 1× Mobile-Media-Query

# show.ts
parseDate / formatDate / compareByDate / upcoming / past / nextShow / showSlug / showUrl / showAction
```

Kein `Bento`-, `Hero`- oder `Presse`-Begriff neu — alles bleibt `CONTEXT.md`.

## 7 · Tests — Interface ist Testfläche

- Vorher: `termin.test.mjs:13-20` prüft `byDate` implizit via Sortierreihenfolge; `bento.test.mjs` prüft totes `bento.js`; `cms-wiring` prüft Strings.
- Nachher: Ein Test gegen `show.ts` **Interface** deckt alle Seiten ab: Sortierung `t.b.a.`→hinten, `nextShow` = früheste kommende, `showUrl` stabil, `showAction` Label nach `DESIGN.md`.
- Layout: Snapshot/Rende-Test `SiteHeader` mit `nextShowUrl=null` (kein Button) vs. gesetzt.

## 8 · Risiken & Nicht-Ziele

- Kein neuer Fetcher-Seam für CMS in Phase 1 — `getShows` bleibt `catch{}`-Fallback; ein zweiter **Adapter** (z. B. Mock-CMS) rechtfertigt erst dann eine echte **Seam** („one adapter = hypothetical").
- Webflow-CSS (`scttrd-websitze.webflow.css`) bleibt vorerst — Layout zieht nur den Header heraus, kein Full-Rewrite.
- `src/lib/showCard.js:1-11` Webflow-`data-w-id`-Leak bleibt separat — nicht Teil dieses Hubs (6. Punkt im Backlog).

## 9 · Verifikation

- `npm run build` grün (heute grün trotz `termin.js` implizitem `any` — nachher typisiert sauber).
- Manuell: `/` Header zeigt `Shows · Linkhub · Galerie` + Logo; Button `Next Show ↗` → `/shows/<nächste-upcoming>/` (z. B. heute `singoldsand-21-08-2026`); `/shows/<past>/` zeigt `Event & Tickets` nur oberhalb Line-up; `/links/` Karten behalten roten `Tickets ↗` Chip.
- Mobile: `@media(max-width:767px)` einmal in `SiteHeader.astro`, nicht 3× dupliziert.

## 10 · Entscheidungen aus Produktfragen (02.10.2026 — fixiert)

1. **Nächste Show markiert:** `Badge „NEXT“ + oben fixiert` — früheste `upcoming` nach `compareByDate` ( `t.b.a.` ignoriert), visuell mit Badge + als erste Kachel gepinnt, Rest nach Datum. Quelle: `show.ts:nextShow`. Button immer zur **Veranstaltungsseite** (`showUrl`), nicht Ticket.
2. **Menü „Alle Shows“ tolerant:** Link auf `#shows` ist okay — führt auf `/` zur Liste. Header bleibt `Shows | Linkhub | Galerie` (nur diese 3, `CONTEXT.md` ergänzt).
3. **Linkhub/Galerie Reihenfolge:** `Shows | Linkhub | Galerie` (funnel-absteigend).

## 11 · Zusatz-Module aus Produktfragen (gleicher Hub, kein Scope-Creep)

Diese 3 sind **eigene tiefe Module** hinter eigenen **Seams**, hängen aber am selben Hub — 80/20 bleibt, weil sie den Hub nicht aufblähen:

### 11.1 Tracking-Modul `src/lib/tracking.ts`

**Seam:** reine Funktion `withTracking(href, { source, medium, campaign }) → href` — hängt `?utm_source=linkhub&utm_medium=...` nur an Ticket-`href`s an, nicht an `showUrl`. Zweite Funktion `referrerFrom(request)` für Server-Logs. Kein Analytics-SDK im Hub.

**Interface:** `trackedTicketUrl(show, source)` — nutzt `showAction(show).href` nur wenn `kind==='ticket'`. Ein **Adapter** heute (UTM-String), zweiter später (Plausible/GA4) ohne Hub-Änderung.

### 11.2 Link-Scrape-Modul `src/lib/linkScrape.ts` (Server-only)

**Seam:** `scrapeLink(url) → { title, cover, platform }` via `oEmbed` (Spotify/Soundcloud) → Fallback `OpenGraph`. **Adapter** 1: `fetch` live, **Adapter** 2: Fake für Tests. Payload-Hook `beforeChange` auf `Links`-Collection ruft es auf, überschreibt nur leere Felder — manuelle Eingabe bleibt.

**Scope:** Nur Spotify (Track, künftig Playlist) + Soundcloud (Track/Playlist) + generisch `title/cover` für andere — wie gewünscht („nicht viel mehr“), aber **Interface** bleibt erweiterbar für weitere Links „wie hier oben“.

### 11.3 Payload-Vorschau-Modul (CMS-Seite)

**Seam:** `cms/src/components/LinkHubPreview.tsx` (Payload Custom Component) — rendert rechten iPhone-Mock von `/links/` live aus Form-State + `QRCode` (`/links/` URL). Kein zweites Datenmodell — liest dasselbe `Link Hub` Global + `Links` Collection.

**Verifikation:** Im Payload bei jedem Link-Save sieht man sofort Avatar/Release-Kachel/Upcoming-Shows + externe Links + QR zum Handy-Test — wie gewünscht „Vorschau + QR-Code“.

## 12 · Aktualisierte Schritte (mit Zusatz-Modulen)

**Phase 0b — Tracking/Scrape-Seams vorsehen (kein Code, nur Verträge):**
- `tracking.ts` Vertrag: nur Ticket-Hrefs, nie `showUrl`.
- `linkScrape.ts` Vertrag: `platform in {spotify,soundcloud,youtube,instagram,web}` — `Cover+Titel+Typ` via oEmbed, manuell überschreibbar.

**Phase 1+2 bleiben Hub (Show + Header) — unverändert.**

**Phase 3 — Zusatz (nach Hub grün, unabhängig voneinander):**
- 3a Tracking: `tracking.ts` + `links.astro` + `shows/[slug].astro:ticket` CTA mit `trackedTicketUrl(source=linkhub|homepage, medium=show-card|ticket-button)`.
- 3b Scrape: `linkScrape.ts` + Payload Hook auf `Links` (füllt nur leere Felder, manuell überschreibbar).
- 3c Preview: `LinkHubPreview.tsx` + QR in `Link Hub` Global.

## 13 · Entscheidungen Runde 2 (fixiert)

1. **t.b.a. → hinten + kein NEXT** — `t.b.a.` sortiert via `order` ans Ende, `nextShow` liefert `null` wenn nur t.b.a. vorhanden; getrennter Badge `T.B.A.` möglich, aber nie gepinnt.
2. **UTM = linkhub / show-card** — `utm_source=linkhub|homepage`, `utm_medium=show-card|ticket-button` (trennt Funnel-Quellen).
3. **Scrape = nur leere Felder** — oEmbed/OpenGraph füllt `Titel/Cover/Typ` nur wenn Feld leer; Hand-Eingabe gewinnt.
4. **Bento = Hybrid wie heute** — `BENTO_HARDCODED` (Radio Rudina + 2 Komod) + 3 `reels.slice(0,3)` aus CMS; kein Voll-CMS-Umbau.
5. **Mobile = Hamburger** — Header zeigt Logo + Burger, Menü `Shows | Linkhub | Galerie` klappt aus; `Next Show ↗` bleibt primärer Button im Header (rechts) + zusätzlich im aufgeklappten Menü.

## 14 · RFC-Pipeline-Lauf (Ralph-Loop bis Ende — ausgeführt)

DAG: `U1 → {U2, U3} → U4 → U5 → {U6, U7} → {U8, U9} → U10`. Alle Units sequenziell nach Abhängigkeiten gemergt, Tests nach jeder Unit re-run. Keine Commits (nur auf Go).

| Unit | Status | Nachweis |
|------|--------|----------|
| U1 Datumskern + `nextShow` | DONE | `tests/show.test.mjs` Tracer 2/2 |
| U2 `upcoming`/`past`/`orderedUpcoming` + NEXT-Pin | DONE | Auswahl-Suite 4/4; `t.b.a.` hinten via `order`, `past` neueste-zuerst |
| U3 `showSlug`/`showUrl`/`showAction` | DONE | Identität-Suite 3/3 (Umlaute, Template-1×, DESIGN-Labels) |
| U4 `termin.js`-Shim (`toTs` via `parseDate`, Semantik identisch) + `cms.ts` importiert `showSlug` aus Hub | DONE | Alt-Tests 3/3 unverändert grün, Build grün |
| U5 Seiten-Konsum: `orderedUpcoming` + NEXT-Badge (`Customers pinFirst`, links `show-next-badge`), ISO-`datetime`, `showAction`-CTA, Next→`showUrl` | DONE | Build grün; Smoke: Badge home/links, `datetime="2026-…"`, CTA-Labels |
| U6 `SiteHeader.astro` + `BaseLayout.astro` + Hamburger (aria/ESC/Fokus, 1× Media-Query) + `socialNavLinks`; index/shows/gallery migriert; Galerie-`Arial`→Poppins | DONE | Build grün; Smoke: `data-site-burger`, `aria-controls`, `aria-current="page"` auf `/gallery/`, Canonical auf Show-Seite |
| U7 `tracking.ts` (`withTracking` Query/Hash-erhaltend, `trackedTicketUrl` nur `kind=ticket`) + Chip/CTA-Verdrahtung | DONE | Tracking-Suite 2/2; Smoke alle Routen 200 |
| U8 `linkScrape.ts` (oEmbed→OG-Fallback, Fake-Adapter) + Payload-`beforeChange` (nur leere Felder, kein Schema-Change) | DONE | Scrape-Suite 5/5; Follow-up: `cover`-Feld braucht Migration |
| U9 `LinkHubPreview`: echte Form-Daten (Handle/Titel/Release-State), Pflichtfeld-Checkliste, QR + URL, einklappbar, mobil sichtbar statt `display:none` | DONE | Visuell (CMS-Build braucht DB — vor Deploy verifizieren) |
| U10 Final | DONE | `node --test tests/*.test.mjs`: **40/40**; `npm run build` grün; Smoke 6/6 Routen 200; 1 stale `cms-wiring`-Assertion auf Hub-Verdrahtung aktualisiert |

Integrationsrisiken (Rest): U9-CMS-Build ungeprüft (DB nötig); `cover`-Feld für Scrape-Covers braucht Payload-Migration; Arbeitsbaum enthält uncommittete Fremdänderungen + gelöschte `cms/src/migrations/*` (nicht angefasst).

## 15 · Nach-Verifikation („verifizieren noch“)

- `npm run build` grün; `node --test tests/*.test.mjs` **40/40** (11 Suites).
- CMS: `Links.ts` + `LinkHubPreview.tsx` typchecken unter echter `bundler`-Resolution (Exit 0). Dabei gefunden+gefixt: `.ts`-Endung im dynamischen Import (TS5097) → extensionless (korrekt für `bundler`).
- Smoke (alle 200): `/`, `/links/`, `/gallery/`, 3× `/shows/<slug>/`. Geprüft: `data-site-header`/`data-site-burger`/`aria-controls`/`aria-expanded`, Toggle-Script (minifiziert, `Escape`-Handler drin), `aria-current="page"` auf `/gallery/`, NEXT-Badges home+links, `datetime="2026-08-21"`, Canonical auf Show-Seite, Galerie-Titelblock.
- Tracking-UTM im gerenderten HTML nicht sichtbar — korrekt: kein Datensatz mit Ticket-Domain vorhanden (`trackedTicketUrl` → `null` → Plain-Link). UTM-Pfad ist nur unit-getestet; sobald eine Show mit Eventbrite-Link existiert, Smoke nachholen.

## 16 · Link-Cover (nachgezogen)

- `cms/src/collections/Links.ts`: neue optionale Felder `cover` (Text, Cover-URL) + `scrapedAt` (Date, readOnly). Kein Migrationsfile nötig — Payload läuft im Push-Modus (`payload.config.ts: push !== 'false'`), Schema-Sync beim Boot.
- `src/lib/linkScrape.ts` `applyScrapedLink`: füllt zusätzlich `cover` (nur wenn leer) + stempelt `scrapedAt`; Hook-Bedingung scrapt auch nach, wenn nur das Cover fehlt.
- Website: `getLinks` mapped `cover` aus CMS-Docs, `content.config.ts` links-Schema kennt optionales `cover`, `links.astro` rendert 40px-Thumb im Button.
- Tests: Scrape-Suite 5/5 (Cover-Regel), Gesamt 40/40, Build grün, CMS-Typcheck Exit 0.

## 18 · Boot-Migration hing → expliziter CI-Schritt (2026-09-08)

- `prodMigrations`-Verdrahtung im Boot ließ `scttrd-all-cms` nie healthy werden (kein Crash, keine Logs remote einsehbar) → Deploy schlug fehl, CMS down.
- Lehre: Migrationen NIE im Container-Boot (blockiert Healthcheck unsichtbar), sondern als expliziter Deploy-Schritt mit Timeout + sichtbaren Logs.
- Umsetzung: `prodMigrations`-Wiring aus `payload.config.ts` entfernt (Dateien bleiben liegen), neuer CI-Step `Run CMS migrations` (`docker compose run --rm cms npm run payload -- migrate`, `timeout 180`) zwischen Rebuild und Smoke.

## 17 · Deploy (automatisch, CI-rot→grün)

- Erster Push (`7e2745f`) ließ CI rot werden: CMS-Docker-Context enthält nur `cms/` — der Website-Import `../../../src/lib/linkScrape` schlug fehl (`Can't resolve … in '/app/src/collections'`).
- Fix (`86ad2bc`): `cms/src/lib/linkScrape.ts` als eigenständige Kopie (Sync-Hinweis im Header), Hook-Import auf `../lib/linkScrape`.
- CI-Run `34201482018` **success** (4m13s): Web+CMS gebaut, deployed, Live-Smoke grün.
- Eigener Live-Check `https://scttrd.de`: `/`, `/links/`, `/gallery/`, Show-Seite je 200; Burger/Menu/NEXT-Badges/ISO-`datetime`/`aria-current` verifiziert.
