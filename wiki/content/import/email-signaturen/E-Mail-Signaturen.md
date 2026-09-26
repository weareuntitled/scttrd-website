# E-Mail-Signaturen

> **Owner:** Barbara · **Zuletzt geprüft:** 2026-09-26  
> **Zugriff:** nur Band (Nate, Barbara, Daniel, Babsi)

## So nutzt ihr das in Docmost

Docmost kann **kein HTML in Markdown rendern** — dafür drei Wege (laut [Docmost Doku](https://docmost.com/docs/user-guide/import-export)):

| Weg | Wofür |
| --- | --- |
| **HTML-Seiten importieren** | Vorschau + Download als eigene Unterseiten |
| **File attachment** (`/`) | `.html`-Datei anhaengen, Download-Button |
| **Iframe embed** (`/`) | Live-Vorschau von scttrd.de (URLs unten) |

### Einmal-Import (empfohlen)

1. Space **Regeln & Betrieb** (oder Admin)
2. Sidebar **...** neben Pages → **Import pages**
3. ZIP: `wiki/content/import/email-signaturen.zip` aus dem Repo
4. Docmost legt **E-Mail-Signaturen** + je eine **HTML-Unterseite** pro Person an

### In Apple Mail einrichten

1. HTML-Unterseite in Docmost oeffnen **oder** Datei von scttrd.de laden (Links unten)
2. Im Browser: **Cmd+A** → **Cmd+C**
3. Mail → Einstellungen → Signaturen → einfuegen
4. **„Immer meine Standardschriftart verwenden“** deaktivieren

> Keine Emojis in Signaturen — Mail macht daraus kaputte Zeichen (`ðŸ"§`).

---

## Uebersicht

| Person | Konto | HTML-Datei | Vorschau (scttrd.de) |
| --- | --- | --- | --- |
| Booking (neutral) | info@scttrd.de | `scttrd-booking.html` | https://scttrd.de/styleguide/assets/signatures/scttrd-booking.html |
| Daniel Peters | info@scttrd.de | `scttrd-daniel-peters.html` | https://scttrd.de/styleguide/assets/signatures/scttrd-daniel-peters.html |
| Nate | info@scttrd.de | `scttrd-nate.html` | https://scttrd.de/styleguide/assets/signatures/scttrd-nate.html |
| Barbara | info@scttrd.de | `scttrd-barbara.html` | https://scttrd.de/styleguide/assets/signatures/scttrd-barbara.html |
| Babsi | info@scttrd.de | `scttrd-babsi.html` | https://scttrd.de/styleguide/assets/signatures/scttrd-babsi.html |
| Daniel S. (DJ) | info@daniel-s.com / djdanep@gmail.com | `daniel-s-dj.html` | https://scttrd.de/styleguide/assets/signatures/daniel-s-dj.html |

Logo ist in allen SCTTRD-HTML-Dateien **eingebettet** (Base64) — kein Blockieren durch externe URLs.

---

## Vorschau einbetten (Iframe)

In Docmost: `/` → **Iframe embed** → URL aus der Tabelle oben einfuegen.

Beispiel Daniel Peters:

`https://scttrd.de/styleguide/assets/signatures/scttrd-daniel-peters.html`

---

## Text-Versionen (Fallback)

### Booking

```text
SCTTRD
Live Techno & Vocals · Augsburg
info@scttrd.de
scttrd.de · @scttrd_ofc
```

### Daniel Peters

```text
Daniel Peters
Live-Set & Technik · SCTTRD
SCTTRD
Live Techno & Vocals · Augsburg
info@scttrd.de
scttrd.de · @scttrd_ofc
```

### Nate

```text
Nate
Booking & Live Operations · SCTTRD
SCTTRD
Live Techno & Vocals · Augsburg
info@scttrd.de
scttrd.de · @scttrd_ofc
```

### Barbara

```text
Barbara
Backoffice · SCTTRD
SCTTRD
Live Techno & Vocals · Augsburg
info@scttrd.de
scttrd.de · @scttrd_ofc
```

### Babsi

```text
Babsi
Vocals · SCTTRD
SCTTRD
Live Techno & Vocals · Augsburg
info@scttrd.de
scttrd.de · @scttrd_ofc
```

### Daniel S. (DJ)

```text
Daniel S.
DJ / Producer · Hardgroove · Techno · Raw & Hypnotic
info@daniel-s.com | djdanep@gmail.com
+49 173 5231109
linktr.ee/daniels.ofc
@daniel_s.ofc
```

---

## Regeln

- Aenderungen im Repo: `node scripts/build-email-signatures.mjs` → neu deployen
- Keine grossen Banner, Logo ~52 px
- Instagram SCTTRD: **@scttrd_ofc**
- Booking-Mails: Booking- oder Nate-Signatur
