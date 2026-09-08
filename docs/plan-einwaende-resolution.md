# Plan — Einwände auflösen (Stopp-Punkt)

> Zweck: JEDEN offenen Einwand aus der Session in einen abgestimmten, verifizierbaren
> Ablauf überführen. **Nichts wird ausgeführt, bevor dieser Plan freigegeben ist.**
> Stand Ist-Zustand: 08.09.2026, nach Commit `766289e` (CI-Run `34209053021` grün;
> `/api/shows` + `/api/links` antworten aktuell mit 200).

---

## 1 · Einwand-Übersicht

| # | Einwand | Root-Cause | Lösung | Verifikation | Status |
|---|---------|-----------|--------|--------------|--------|
| E1 | CMS lädt nicht / API 500 (shows+links) | Prod pusht kein Schema (`NODE_ENV=production` skippt push); Boot-`prodMigrations` hing Container | Migrationen explizit im CI (additiv, idempotent), nicht am Boot | `curl /api/shows /api/links` → 200; `scripts/smoke.mjs` deckt ab | 🟡 API 200, Daten unverifiziert |
| E2 | LinkHub: keine neuen Links erzeugbar, Vorschau fehlt | Website fiel auf lokale Fallback-Links, weil API 500 (E1) | E1 heilen; `LinkHubPreview` lädt echte Collection-Daten (geschrieben, unverifiziert) | Payload: neuen Link anlegen → erscheint in `/links/` + Vorschau | 🟡 Code da, Live unverifiziert |
| E3 | Shows fehlen (Kneipenfestival KOE/Aichach 17.10.2026, paarrauschen.de) | Show existierte nur im CMS, API down → Fallback auf lokale MDs | Lokale MD angelegt (`paarrauschen-kneipenfestival.md`); live prüfen | `/shows/...`, Home-Liste, NEXT-Verhalten | 🟡 committed, unverifiziert |
| E4 | „Topmost“ = Docmost-Wiki ist leer | Frisches Docmost; Spaces fehlten; Imports async | Spaces angelegt; 6 ZIP-Importe gestartet; Seiten via korrektem Endpoint prüfen | `/pages/sidebar-pages` je Space → Seiten > 0 | 🟡 Imports „processing“, 0 Seiten sichtbar |
| E5 | Past-Shows dürfen keine Ticket-Links; Ticket↔Website unterscheiden | `linkKind` implementiert, DB-Spalte fehlte (E1) | Migration legt `link_kind` an; `showAction` unterdrückt Past-Tickets | Smoke: Past-Show ohne eventbrite; Upcoming mit `website` ≠ Ticketshop | 🟡 Code da, Live unverifiziert |
| E6 | Deploy hängt/fehlt robust (Migration interaktiv) | Payload `migrate` fragt y/N bei dev-gepushten DBs; Boot-Migration blockierte Healthcheck | `yes |`-Step + Timeout; Migrationen NIE im Boot | CI grün (✅ `34209053021`); Smoke läuft durch | 🟢 CI grün |
| E7 | Credentials (Docmost, DB, Payload) | Klartext in Session | **Nie committen**; nur ad-hoc nutzen; optional in `.env` des Servers | `git grep` keine Secrets | 🔴 Regel |

---

## 2 · Detail-Schritte je Einwand

### E1 + E5 — CMS-Schema heilen (Root Cause)

**Mechanismus (empfohlen, deterministisch):**
1. Migrationen nur als Dateien in `cms/src/migrations/` (additiv, `IF NOT EXISTS`, keine Drops) —
   liegen bereits: `…_add_shows_lineup` + `…_add_link_cover_show_linkkind`.
2. Ausführen im CI-Schritt **nach** `up -d --build`, **vor** Smoke:
   `docker compose -f compose.all.yaml run --rm cms sh -c 'yes | npm run payload -- migrate'` mit `timeout 180`.
   → Hat gerade grün geliefert (Run `34209053021`); API antwortet 200.
3. **Verifikation Schema** (read-only, ohne Payload):
   `docker compose exec cms-db psql -U cms -d scttrd_cms -c "\d shows" -c "\d links"`
   → erwartet: `link_kind` auf `shows`, `cover`+`scraped_at` auf `links`, Tabelle `links` existiert.

**Entscheidung (User, freigegeben):** **A** — `yes | payload migrate` im CI bleibt der Mechanismus.
(Optionen B/C sind damit nicht aktiv; reine SQL-Absicherung optional später.)

> ⚠️ Ausführungspunkt für E1/E5: Schema-Fix nur, falls psql-/API-Prüfung Spalten als fehlend zeigt.
> Stand M1-Prüfung unten ergänzen.

### E2 — LinkHub: Links erzeugen + Vorschau

1. Voraussetzung: E1 (API 200) — ist erreicht.
2. Payload-Admin: unter „Seiten → Links“ neuen Link anlegen (`label`, `platform`, `url`) →
   Hook scrapt Cover/Titel automatisch; Feld `cover`/`scrapedAt` wird befüllt.
3. Website `getLinks()` holt CMS-Docs (inkl. `cover`) statt Fallback; `/links/` rendert Thumbs.
4. `LinkHubPreview` (Global „Link Hub“) lädt echte Links/Shows via `/api/links` + `/api/shows`
   (Client-Fetch, Reload-Button, Fehleranzeige) — liegt, muss im deployed CMS-Build geprüft werden.
5. **Verifikation:** neuen Test-Link anlegen → in `/links/` + im iPhone-Mock der Vorschau sichtbar.

### E3 — Shows wiederherstellen (Kneipenfestival)

1. Lokale MD existiert (Slug `...-paarrauschen...`). Da CI `git archive HEAD` deployed und der
   letzte grüne Run nach dem Show-Commit lief → Show sollte live sein.
2. **Verifikation (read-only):** `https://scttrd.de/shows/<slug>/` → 200; auf `/` in „upcoming shows“
   mit Datum 17.10.2026; korrekte Sortierung (früheste upcoming = Singoldsand 21.08.2026, danach
   KOE 17.10.2026, danach techno & punsch 12.12.2026).
3. **Entscheidung (User, freigegeben):** Pflege künftig **im CMS**. Konsequenz:
   Kneipenfestival-Show im CMS anlegen; die temporäre lokale MD (`paarrauschen-kneipenfestival.md`)
   danach entfernen (keine Doppelpflege). Bis zur CMS-Anlage bleibt sie als Fallback sichtbar.

### E4 — Docmost (Wiki) importieren + verifizieren

1. Ist: Spaces angelegt (`general`, `meetings`, `booking-live`, `release-roadmap`, `presse-rider`,
   `regeln-betrieb`); 6 ZIP-Importe mit Status `processing` gestartet; Seitenliste zeigte 0.
2. **Nächster Schritt (nur Verifikation):** Seiten korrekt listen über
   `POST /api/pages/sidebar-pages` mit `{spaceId}` je Space (Endpoint aus Docmost-Client gefunden;
   `POST /api/pages/` ohne Body war falsch). Falls Imports fehlgeschlagen:
   ZIP-Import erneut triggern und Status/Task prüfen.
3. Wenn Seiten da: Jour-Fixe-/Seiten-Struktur sichten (`wiki/content/pages/*.md`), ggf.
   `gig-techno-und-punsch-2026-12-12.md` als einzelne Seite nachziehen.
4. **Verifikation:** `https://docs.scttrd.de` → Space-Sidebar zeigt Seiten; 1 Beispielseite öffnen.

> **Entscheidung (User, freigegeben):** Docmost-Login bleibt in der Session (kein Server-`.env`).

### E6 — Deploy-Robustheit

1. Status: grün (CI `34209053021`). Ab jetzt fester Bestandteil:
   `Rebuild → CMS-Migration (yes|, timeout) → Smoke (website+gallery+links+cms+shows-api+links-api+docmost+redirect+shows+video)`.
2. Smoke bereits erweitert: `cms-links-api` (200 + docs-Array) und Past-Show-`forbidden`-Marker
   (kein eventbrite auf Past-Seite). Nach jedem Deploy automatisch ausgeführt.

---

## 3 · Reihenfolge (abhängig, wird erst nach Freigabe ausgeführt)

```
M1 Verifikation Schema/API (psql \d + curl)      [read-only]
 ├── M2 E1/E5: Schema-Fix nur falls Spalten fehlen (CI/Migration)
 └── M3 E3: Kneipenfestival-Show live prüfen (/shows, Home)
M4 E2: LinkHub — Test-Link + Vorschau verifizieren (Payload-Admin)
M5 E4: Docmost — Seiten via sidebar-pages listen, Imports fertigstellen
M6 E6: Deploy erneut voll durchlaufen lassen + Smoke grün dokumentieren
M7 E7: Secrets-Check (git grep) + Bereinigung, falls nötig
```

---

## 4 · Offene Entscheidungen (vor Ausführung nötig)

1. **Migrationsmechanismus:** A (`yes | payload migrate`) / B (SQL via psql) / C (Boot) — Empfehlung A+B.
2. **Show-Pflege:** lokal (git) vs. CMS — Empfehlung lokal.
3. **Docmost-Zugriff:** Soll `import.ps1`-Login künftig über `.env` (Server) laufen statt Klartext in Session?
4. **Entscheidung (User, freigegeben):** Zusätzlich ein **„Links verwalten“-Schnellzugriff**
   im Preview (Link zu `/admin/collections/links`), damit neue Links ohne Umwege erstellt werden.

---

## 5 · Stopp-Regeln (Stand: freigegeben für §3-Ausführung)

- **Freigegeben:** Plan §3 abarbeiten; Entscheidungen §4 = 1A / 2-CMS / 3-Session / 4-Links verwalten.
- Verifikation read-only zuerst (curl GET, Listen-Endpoints), Schreibzugriffe nur gezielt je Schritt.
- Credentials werden nie in Dateien/Commits geschrieben.
- Nach jedem Schritt verifizieren; bei Abweichung stoppen + rückfragen.