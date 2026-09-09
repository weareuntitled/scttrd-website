# Plan - Startseite: SEO, GEO, UX und Produktqualitaet

> Ziel dieses Plans ist eine fokussierte, schnell erfassbare und technisch gut auffindbare SCTTRD-Startseite. Die Seite soll in wenigen Sekunden beantworten: Wer ist SCTTRD, was passiert als Naechstes und wie kann man SCTTRD buchen?

## 1. Leitentscheidung

### Der eine Satz

**SCTTRD ist ein elektronisches Live-Projekt aus Augsburg zwischen Post-Punk, Techno und Trance.**

Dieser Satz wird zur inhaltlichen Leitplanke fuer Hero, H1, Meta Description, Organization-Schema und AI-crawlbare Textstruktur.

### Die eine Hauptaktion

Die Startseite priorisiert eine Handlung:

1. Besucher sehen die naechste Show.
2. Besucher oeffnen die Veranstaltungsseite.
3. Von dort aus finden sie Ticket- oder Veranstalterlinks.

Die Buchungsanfrage bleibt die zweite Hauptaktion fuer Veranstalter und wird erst nach Identitaet und Live-Beweis prominent angeboten.

### Steve-Jobs-Pruefung

Jedes neue Element muss mindestens eine dieser Fragen positiv beantworten:

- Macht es SCTTRD schneller verstehbar?
- Macht es die naechste Show schneller auffindbar?
- Erzeugt es Vertrauen in die Live-Qualitaet?
- Macht es Booking konkreter und einfacher?

Wenn nicht, wird das Element nicht auf der Startseite benoetigt.

## 2. Ist-Zustand

| Bereich | Aktueller Zustand | Problem / Risiko |
|---------|------------------|------------------|
| Hero | Grosse SCTTRD-Headline, zwei Bilder, Next-Show-Karte | Starke Bildwirkung, aber der inhaltliche Satz fehlt als sichtbare Orientierung. |
| Navigation | Logo, Shows, Links, Galerie, About, Next Show | Auf Mobile brauchbar, aber Fokus und Menuezustand sind noch nicht vollstaendig geschlossen. |
| About | Textblock mit Bio | Inhalt ist vorhanden, aber nicht als kurze, answer-first Erklaerung fuer Nutzer und AI-Sucher strukturiert. |
| On stage | Bento-Raster mit mehreren Autoplay-Videos | Gute Live-Demonstration, aber hoher Medienaufwand und keine Alternativdarstellung fuer Videos. |
| Shows | Upcoming und Past Shows als Zeilenlisten | Upcoming ist wichtig; Past Shows konkurriert derzeit zu stark mit dem naechsten Schritt. |
| CTA | Grosses Video plus Booking-Mail-Link | Visuell stark, aber auf Mobile sollte die Interaktion kurz und direkt bleiben. |
| SEO | Titel und Description vorhanden | Homepage hat noch keine Canonical-, OG-, Twitter- oder JSON-LD-Auszeichnung. |
| GEO | Wenig strukturierter, zitierfaehiger Fliesstext | AI-Systeme bekommen keine klare Entity-Definition mit Ort, Genre, Format und Booking-Kontext. |
| Technik | Astro SSR, Webflow-CSS plus lokale Overrides | Funktioniert, aber die Kaskade erschwert weitere sichere Anpassungen. |

## 3. Zielbild

### Nutzerfluss

```text
Landing
  -> SCTTRD verstehen
  -> Naechste Show erkennen
  -> Veranstaltungsseite oeffnen
  -> Ticket / Veranstalterlink nutzen
  -> Optional: Booking anfragen
```

### Zielreihenfolge der Startseite

1. Header mit Logo, Shows und Next Show.
2. Hero mit H1, Ein-Satz-Definition, zwei Bildern und Next-Show-Karte.
3. Kurzer About-Block: Was ist SCTTRD, woher, welches Live-Format?
4. On-stage-Beweis mit kuratierten Medien.
5. Upcoming Shows als primaere Liste.
6. Booking-CTA.
7. Past Shows als Archiv, visuell sekundar.
8. Footer mit wenigen klaren Links.

## 4. Umsetzung nach Prioritaet

## Phase 0 - Baseline und Arbeitsweise

**Ziel:** Vor jeder weiteren Aenderung einen reproduzierbaren Ausgangspunkt schaffen.

### Aufgaben

- [ ] `npm run check` separat ausfuehren.
- [ ] `npm run build` separat ausfuehren, nicht parallel zu anderen Astro-Prozessen.
- [ ] `node --test tests/*.test.mjs` ausfuehren und die bestehenden `.ts`-Loader-Fehler dokumentieren.
- [ ] Lokale Preview starten: `npm run preview -- --host 127.0.0.1 --port 4329`.
- [ ] Startseite bei 375px, 390px, 768px und Desktop-Breite pruefen.
- [ ] Bestehenden Lighthouse-/Accessibility-Befund als Baseline sichern.

### Abnahme

- Build ist reproduzierbar gruen.
- Die Startseite kann lokal unter `/` auf Desktop und Mobile geoeffnet werden.
- Vorher/Nachher-Probleme werden nicht nur anhand des Codes, sondern anhand der gerenderten Seite bewertet.

## Phase 1 - Hero auf eine Aussage fokussieren

**Ziel:** Innerhalb von drei Sekunden muss klar sein, was SCTTRD ist.

### Dateien

- `src/pages/index.astro`
- `src/content/home/text.md`
- `src/content.config.ts`
- optional `src/styles/tokens.css`

### Aufgaben

- [ ] Den Hero-H1 nicht nur als `SCTTRD` verwenden, sondern eine sichtbare Subline ergaenzen: "Elektronisches Live-Projekt aus Augsburg".
- [ ] Einen kurzen Genre-Satz direkt unter dem H1 platzieren: "Post-Punk, Techno und Trance. Punk, aber schoen."
- [ ] `Next Show` als primaere Karte beibehalten und visuell vor Past Shows priorisieren.
- [ ] Die Hero-Bilder mit festen responsiven Seitenverhaeltnissen und `object-fit: cover` stabilisieren.
- [ ] Fuer das erste Hero-Bild `fetchpriority="high"` und fuer das zweite Bild lazy loading verwenden.
- [ ] Alt-Texte fuer beide Hero-Bilder im CMS/Fallback erzwingen; kein leerer Alt-Text bei inhaltlich relevanten Pressebildern.
- [ ] Bei fehlender naechster Show einen gestalteten Empty State ausgeben, statt die wichtigste Informationsflaeche ersatzlos zu entfernen.

### Content-Regel

Der Hero darf maximal enthalten:

- eine H1,
- eine kurze Definition,
- eine primaere Next-Show-Aktion,
- einen visuellen Live-Beweis.

Alles andere gehoert darunter.

### Abnahme

- Ein Erstbesucher kann SCTTRD ohne Scrollen beschreiben.
- Die naechste Show ist ohne Suche oder Interpretation erreichbar.
- Der Hero erzeugt bei 375px keinen horizontalen Scroll und keinen Bildueberlauf.

## Phase 2 - Show-Funnel und Informationsarchitektur

**Ziel:** Die Seite fuehrt Besucher ohne Umweg zur relevanten Veranstaltung.

### Dateien

- `src/pages/index.astro`
- `src/components/Customers.astro`
- `src/pages/shows/[slug].astro`
- `src/lib/show.ts`
- `src/components/SiteHeader.astro`

### Aufgaben

- [ ] Upcoming Shows vor Past Shows platzieren und deutlicher als primaeren Bereich kennzeichnen.
- [ ] Die erste Upcoming Show weiterhin mit `Next` markieren, aber nur einmal pro Viewport-Fokus.
- [ ] Past Shows als Archiv behandeln: kleinere visuelle Gewichtung, optional einklappbar oder nach dem Booking-CTA.
- [ ] Jede Show-Zeile als klaren Link mit Venue, Stadt und Datum beibehalten.
- [ ] Keine Information nur ueber Farbe vermitteln; `Next` bleibt als Text-Badge bestehen.
- [ ] Zeilen auf Mobile als Zwei-Zeilen-Layout ausgeben: Venue oben, Stadt links und Datum rechts.
- [ ] Lange Venue-Namen testen: kein Abschneiden, kein Overflow, kein unlesbarer Umbruch.
- [ ] `showUrl()` und `nextShow()` als einzige Quelle fuer Show-Ziel und Sortierung verwenden.

### Abnahme

- Ein Nutzer findet die naechste Show in maximal einem Tap nach dem Hero.
- Alle Show-Zeilen sind mindestens 44px hoch und vollstaendig tastaturbedienbar.
- `t.b.a.`-Termine erzeugen keine falsche zeitliche Priorisierung.

## Phase 3 - Accessibility und UX-Hygiene

**Ziel:** WCAG-2.1-AA-Grundlagen erfuellen, ohne die visuelle Identitaet abzuschwaechen.

### Navigation

- [ ] Skip-Link "Zum Inhalt springen" vor dem Header ergaenzen.
- [ ] Einen eindeutigen `<main id="main-content">`-Landmark verwenden.
- [ ] Mobile Menue oeffnet mit Fokus im Menue und schliesst bei Escape.
- [ ] Mobile Menue schliesst nach Auswahl eines Links.
- [ ] Fokus bleibt sichtbar und hat mindestens 3px Kontrast zum Hintergrund.
- [ ] `aria-expanded` und `aria-controls` bleiben synchron zum sichtbaren Zustand.
- [ ] Bei offenem Menue darf der Hintergrund nicht versehentlich als interaktiv erscheinen.

### Medien

- [ ] Autoplay-Videos nur stumm und pausierbar ausfuehren.
- [ ] `prefers-reduced-motion` respektieren und Autoplay/Parallax deaktivieren.
- [ ] Fuer zentrale Videos eine kurze Textalternative oder ein Poster mit beschreibendem Alt-Kontext anbieten.
- [ ] Pruefen, ob das CTA-Video wirklich fuer Booking noetig ist; wenn nicht, als Poster oder sekundaren Beweis behandeln.

### Semantik und Kontrast

- [ ] Genau eine H1 verwenden.
- [ ] Abschnittstitel als H2, Shows nicht als unstrukturierte visuelle Zeilen behandeln.
- [ ] `lang="de"` beibehalten.
- [ ] Kontrast fuer Rot auf Schwarz, Rot auf Weiss und kleine Metadaten messen.
- [ ] Zoom auf 200 Prozent und Reflow auf 320px testen.
- [ ] Alle interaktiven Elemente auf mindestens 44 x 44px pruefen.

### Abnahme

- Die Startseite ist nur mit Tastatur bedienbar.
- VoiceOver kann Header, Hero, Shows und Booking in sinnvoller Reihenfolge lesen.
- Bei reduzierter Bewegung bleibt die Seite vollstaendig nutzbar.

## Phase 4 - SEO-Basics der Homepage

**Ziel:** Suchmaschinen und Social Previews bekommen eine vollstaendige, kanonische Beschreibung der Seite.

### Dateien

- `src/pages/index.astro`
- `src/layouts/BaseLayout.astro` oder eine neue gemeinsame Head-Komponente
- `public/robots.txt`
- `public/og/home.jpg` oder ein gleichwertiges Social-Preview-Asset
- `astro.config.mjs`

### Meta-Aufgaben

- [ ] Canonical auf `https://scttrd.de/` setzen.
- [ ] Open Graph setzen: `og:title`, `og:description`, `og:url`, `og:type`, `og:image`.
- [ ] Twitter Card setzen: `summary_large_image`, Titel, Description und Bild.
- [ ] `theme-color` konsistent mit der SCTTRD-Farbwelt setzen.
- [ ] Title auf Marke plus klare Kategorie ausrichten, z. B. `SCTTRD - Elektronisches Live-Projekt aus Augsburg`.
- [ ] Description auf ca. 150-160 Zeichen pruefen und answer-first formulieren.
- [ ] Veraltetes `meta name="generator" content="Webflow"` entfernen oder nicht mehr ausgeben.

### Robots und Sitemap

- [ ] `public/robots.txt` anlegen.
- [ ] Sitemap-Strategie fuer SSR festlegen: Astro Sitemap-Integration oder serverseitig gepflegte Sitemap.
- [ ] Homepage, `/shows/<slug>/`, `/gallery/` und `/links/` aufnehmen.
- [ ] CMS-/Admin-/API-Routen nicht indexieren.
- [ ] Googlebot, Bingbot, GPTBot, ChatGPT-User, PerplexityBot und ClaudeBot nicht unbeabsichtigt blockieren.

### Abnahme

- Jede indexierbare Seite hat Title, Description und Canonical.
- Social Preview zeigt ein passendes SCTTRD-Bild statt eines zufaelligen Hero-Crops.
- `robots.txt` und Sitemap sind im Preview/Deployment erreichbar.

## Phase 5 - GEO und strukturierte Entity-Daten

**Ziel:** AI-Suchsysteme koennen SCTTRD eindeutig als lokale Live-Musik-Entity verstehen und zitieren.

### Entity-Definition

Die Homepage soll in einem kurzen, gut extrahierbaren Block nennen:

- Name: SCTTRD
- Typ: elektronisches Live-Projekt / Live-Act
- Ort: Augsburg, Deutschland
- Genres: Post-Punk, Techno, Trance
- Aktiv seit: 2023
- Booking: `info@scttrd.de`
- Naechste Show: Venue, Stadt, Datum und Veranstaltungsseite

### JSON-LD

- [ ] `MusicGroup` oder `PerformingGroup` als Haupt-Entity pruefen.
- [ ] `Organization`-Daten fuer Marke und Kontakt ergaenzen, wenn `MusicGroup` allein nicht alle Anforderungen abdeckt.
- [ ] `WebSite` und `WebPage` verknuepfen.
- [ ] Upcoming Shows als `Event`-Schema auf ihren jeweiligen Detailseiten ausgeben.
- [ ] `sameAs` nur mit echten offiziellen Profilen befuellen: Instagram, Spotify, SoundCloud und weitere belegte Kanaele.
- [ ] Keine erfundenen Reviews, Zahlen, Zitate oder externen Quellen einbauen.

### Answer-first-Content

- [ ] Einen kurzen sichtbaren About-Absatz mit 2-3 Saetzen schreiben.
- [ ] Eine kleine FAQ nur dann ergaenzen, wenn echte Fragen von Veranstaltern/Fans vorliegen.
- [ ] Sinnvolle Fragen koennten sein: "Was ist SCTTRD?", "Woher kommt SCTTRD?", "Wie kann man SCTTRD buchen?"
- [ ] Antworten direkt und faktenbasiert schreiben, ohne Keyword-Stuffing.
- [ ] Interne Links von About zu Shows, Gallery und Booking setzen.

### Abnahme

- Ein AI-System kann aus dem HTML ohne JavaScript-Ausfuehrung Name, Ort, Genre und Booking-Zweck extrahieren.
- Schema ist valide und stimmt mit sichtbarem Text ueberein.
- Keine widerspruechlichen Orts-, Datums- oder Genreangaben existieren.

## Phase 6 - Performance und Medienbudget

**Ziel:** Die Seite fuehlt sich schnell an, besonders auf Mobilfunk.

### Aufgaben

- [ ] Hero-LCP-Bild optimieren und reale Dateigroesse messen.
- [ ] Unterhalb des ersten Viewports Videos erst bei Sichtbarkeit laden.
- [ ] `preload="none"` fuer nicht sichtbare Videos durchgaengig pruefen.
- [ ] Posterbilder komprimieren und mit passenden Dimensionen ausgeben.
- [ ] Cumulative Layout Shift durch Bild-/Video-Dimensionen verhindern.
- [ ] Webflow-JavaScript nur dort laden, wo eine Funktion tatsaechlich gebraucht wird.
- [ ] Custom Cursor und Tilt auf Touch-Geraeten nicht initialisieren.
- [ ] Lighthouse Mobile fuer LCP, CLS, INP und Accessibility messen.

### Zielwerte

| Messung | Ziel |
|---------|------|
| LCP | unter 2,5 Sekunden auf simuliertem Mobile-Fast-3G |
| CLS | unter 0,1 |
| INP | unter 200ms |
| Erste sinnvolle Interaktion | Hero-Link und Menue ohne Medien-Ladezeit nutzbar |
| Mobile Breite | 320px ohne horizontales Scrollen |

## Phase 7 - Detailqualitaet und "Back of the fence"

**Ziel:** Nicht nur der Hero, sondern auch Randfaelle haben dieselbe Qualitaet.

### Randfaelle

- [ ] Keine Upcoming Shows.
- [ ] Upcoming Show ohne Ticketlink.
- [ ] `t.b.a.`-Datum.
- [ ] Fehlendes Showbild.
- [ ] CMS nicht erreichbar und lokale Fallback-Daten aktiv.
- [ ] Fehlendes CTA-Video.
- [ ] Sehr langer Venue- oder Stadtname.
- [ ] Sehr kleine Breite und 200-Prozent-Zoom.
- [ ] `prefers-reduced-motion` und langsame Verbindung.

### Copy-Review

- [ ] Einheitlich `Next Show` oder deutschsprachige Variante entscheiden.
- [ ] Tippfehler in Mail-Betreffzeilen korrigieren.
- [ ] Booking-CTA konkret machen: Wer soll klicken und was passiert danach?
- [ ] Footer auf die drei wichtigsten Wege reduzieren: Shows, Galerie, Booking/Contact.

## 5. Technische Dateiliste

### Bestehende Dateien anpassen

- `src/pages/index.astro` - Hero, H1, Head-Metadaten, Schema, Abschnitte, Medienverhalten.
- `src/components/SiteHeader.astro` - Skip-Link-Unterstuetzung, Fokus, Menue-Schliessung.
- `src/components/Customers.astro` - Tabellen-/Zeilen-Semantik, Empty State, Touch-Ziele.
- `src/layouts/BaseLayout.astro` - gemeinsame SEO-Metadaten, OG und Twitter.
- `src/pages/shows/[slug].astro` - Event-Schema und kanonische Detaildaten.
- `src/lib/show.ts` - konsistente `nextShow()`-/URL-Logik.
- `src/content/home/text.md` - answer-first Beschreibung und Booking-Copy.
- `src/content/home/images.md` - verbindliche Alt-Texte und Bildrollen.
- `src/content.config.ts` - Pflichtfelder fuer SEO-relevante Alt-Texte pruefen.
- `astro.config.mjs` - Sitemap-/Site-Konfiguration.

### Neue Dateien

- `public/robots.txt`
- `public/og/home.jpg`
- optional `src/components/SeoHead.astro`
- optional `src/components/StructuredData.astro`
- optional `src/pages/sitemap-index.xml.ts` oder Astro-Sitemap-Integration
- optional `tests/seo-home.test.mjs`

## 6. Testplan

### Automatisiert

- [ ] `npm run check`
- [ ] `npm run build`
- [ ] `node --test tests/*.test.mjs`
- [ ] Test: Homepage besitzt genau eine H1.
- [ ] Test: beide Hero-Bilder existieren und haben Alt-Text.
- [ ] Test: Canonical zeigt auf `https://scttrd.de/`.
- [ ] Test: JSON-LD enthaelt SCTTRD, Augsburg und Live-Projekt.
- [ ] Test: `robots.txt` und Sitemap werden gebaut.
- [ ] Test: keine Homepage-Breite erzeugt horizontales Overflow in den definierten Breakpoints.

### Manuell

- [ ] 375px iPhone/Android: Hero, Menue, Next Show, Show-Zeilen, Booking.
- [ ] 768px Tablet: Bildraster, Tabellen, CTA-Video.
- [ ] Desktop: visuelle Balance, Hover, Cursor, Bento.
- [ ] Tastatur: Skip-Link, Menue, Hero-Link, Shows, Booking, Footer.
- [ ] VoiceOver: sinnvolle Reihenfolge und klare Linknamen.
- [ ] 200-Prozent-Zoom und 320px Reflow.
- [ ] Reduced Motion.
- [ ] Langsame Verbindung und CMS-Fallback.

## 7. Definition of Done

Die Arbeit ist erst abgeschlossen, wenn:

1. Die Startseite in einem Satz erklaert, was SCTTRD ist.
2. Die naechste Show ist der klarste naechste Schritt.
3. Kein Mobile-Layout ueberlaeuft oder zerfaellt.
4. Die Seite ist tastatur- und screenreader-bedienbar.
5. Canonical, Social Preview, Robots, Sitemap und JSON-LD sind vorhanden.
6. AI-Systeme koennen SCTTRD als Entity mit Ort, Genre und Booking-Zweck extrahieren.
7. Empty-, Fehler-, Medien- und Reduced-Motion-Zustaende sind gestaltet.
8. Build und relevante Tests sind gruen oder bekannte Infrastrukturfehler dokumentiert.
9. Die Seite wurde lokal auf den betroffenen URLs geprueft: `/`, `/shows/<slug>/`, `/gallery/`, `/links/`.
10. Vor einem Commit oder Push wurde die lokale Preview dem User gezeigt und bestaetigt.

## 8. Empfohlene Reihenfolge

1. Phase 0: Baseline sichern.
2. Phase 1: Hero und H1 fokussieren.
3. Phase 2: Show-Funnel und Mobile-Zeilen abschliessen.
4. Phase 3: Accessibility und Navigation reparieren.
5. Phase 4: SEO-Basics und Social Preview umsetzen.
6. Phase 5: JSON-LD und GEO-Content ergaenzen.
7. Phase 6: Medien- und Performance-Budget pruefen.
8. Phase 7: Randfaelle testen und Copy finalisieren.
9. Lokale Preview zeigen, Feedback einarbeiten, erst danach committen/pushen.
