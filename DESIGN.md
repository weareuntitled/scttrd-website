# SCTTRD Design Styleguide

Brutal, aber schoen. Die visuelle Sprache von SCTTRD: Punk-Energie, rote Flaeche,
schwarze Schrift, harte Kanten. Kein Grau, keine Verlaeufe zum Ausgleichen, kein
Webflow-Schnee. Jedes Element sagt entweder ROT oder SCHWARZ – dazwischen nichts.

---

## 1 · Design-Tokens

| Token            | Wert        | Verwendung                              |
|------------------|-------------|-----------------------------------------|
| `--scttrd-red`   | `#f00000`   | Primaere Flaeche, Akzente, Hover        |
| `--scttrd-black` | `#0c0c0c`   | Schrift, Rahmen, Buttons, Box-Shadows   |
| `--cream`        | `#f4f1ea`   | Reserve-Flaeche (nur Links-Hub alt)     |
| `--white`        | `#ffffff`   | Text auf rot, selten                    |
| Radius           | `0`         | Keine abgerundeten Ecken                |
| Shadow           | `5px 5px 0` | Offset-Schatten nur in Schwarz          |

Faustregel: **Hintergrund rot → Schrift schwarz.** **Button schwarz → Schrift rot.**
**Hover: invertieren.** Keine Halbtransparenz, keine rauchigen Overlays.

---

## 2 · Typografie

| Ebene    | Font     | Groesse                    | Stil |
|----------|----------|----------------------------|------|
| Display  | Poppins  | `clamp(48px, 8vw, 124px)`  | 800, `line-height: .82`, `letter-spacing: -.085em`, UPPERCASE |
| Headline | Poppins  | `clamp(24px, 4vw, 56px)`   | 800, neg. Tracking |
| Body     | Poppins  | `14–16px`                  | 400/600 |
| Eyebrow  | Poppins  | `10–13px`                  | 900, `letter-spacing: .14em`, UPPERCASE |

- Fett ist ein Statement, nicht eine Standardeinstellung. 900 fuer Labels, 800 fuer Titel.
- Uppercase + grosses Letter-Spacing = Meta (Eyebrow, Footer, Button).
- Das `SCTTRD`-Wordmark darf als einziges Element bis 100px+ gehen.

---

## 3 · Buttons

**Primaerer Button (CTA):**
```css
.ticket {
  display: inline-block;
  padding: 15px 19px;
  border: 2px solid #0c0c0c;
  background: #0c0c0c;
  color: #f00000;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .04em;
  text-transform: uppercase;
  box-shadow: 5px 5px 0 rgba(12,12,12,.25);
}
.ticket:hover {
  background: transparent;
  color: #0c0c0c;
  box-shadow: 3px 3px 0 #0c0c0c;
  transform: translate(2px, 2px);
}
```
- Pfeil fuer externe Links: `↗` mit `text-decoration: none`.
- Keine Pill-Buttons auf den Show-/Hauptseiten. Pill nur im Link-Hub-Kontext erlaubt.

---

## 4 · Show-Seiten (`/shows/<slug>/`)

| Element        | Vorgabe                                        |
|----------------|------------------------------------------------|
| Body           | `background: #f00000`, `color: #0c0c0c`        |
| Grid           | 2 Spalten: Bild `1.12fr` / Info `0.88fr`, zentriert |
| Bild           | `border: 3px solid #0c0c0c`, `box-shadow: 14px 14px 0 #0c0c0c` |
| Eyebrow        | Schwarze Kachel, rote Schrift (`#0c0c0c`/`#f00000`) |
| Venue-Titel    | Display-Groesse, UPPERCASE, `letter-spacing: -.085em` |
| Meta           | `Stadt · Datum` fett, Datum im Format `DD.MM.YYYY` |
| Maps-Link      | Untertrichen, schwarz, `text-underline-offset: 5px` |
| Lineup         | 2-Spalten-Liste, Name links, `Quelle` rechts klein |

Hintergrund-Muster (optional, nur Show-Seiten):
`linear-gradient(135deg, transparent 0 49%, #0c0c0c 49% 50%, transparent 50% 100%)` bei `opacity: .12`, `background-size: 22px 22px`.

---

## 5 · Link Hub (`/links/`)

- Body: **schwarz** (`#000`), Schrift weiss.
- Avatar: runde 120px, `border: 4px solid #f00000`.
- Release-Kachel (Neuester Track): **rote Flaeche**, schwarze Schrift, Cover links, Titel + Spotify-Pfeil rechts. Hover: Lift + roter Glow.
- Link-Buttons: schwarze Kacheln (`#111`, Rand `#2a2a2a`), weisse Schrift. Hover: **komplett rot** mit schwarzer Schrift.
- Tickets-Badge: rot mit schwarzer Schrift.
- Radius: `4px` (hart, aber nicht 0).

---

## 6 · Status & Labels

| Status   | Darstellung                    |
|----------|--------------------------------|
| upcoming | Eyebrow `upcoming show`, Ticket-Button `Tickets sichern ↗` |
| past     | Eyebrow `past show`, Button `Veranstaltungsseite ↗` / `Video ansehen ↗` |
| Ticket   | Fehlt → `Ticketlink folgt.` in `opacity: .55` |

---

## 7 · Verboten

- Kein `Arial`, kein `Inter`, kein System-Sans auf sichtbaren Texten. Poppins (oder eine bewusst gewaehlte Display-Font).
- Keine abgerundeten Ecken (Radius 0) ausser im Link-Hub.
- Keine Farbverlaeufe, keine Glasmorphismen, keine weichen Schatten.
- Kein Grau zwischen Rot und Schwarz. `opacity` ist das einzige erlaubte Daempfungsmittel.
- Keine Stock-Icons mit Kringeln. `↗` und `←` sind die einzigen erlaubten Glyphen.

---

## 8 · Umsetzung

- Farben als CSS-Variablen in `src/styles/tokens.css` ablegen.
- Show-Seite: `src/pages/shows/[slug].astro`.
- Link Hub: `src/pages/links.astro` + CMS-Global `Link Hub`.
- Neue Seiten folgen diesen Tokens – nicht der alten Webflow-CSS-Datei.