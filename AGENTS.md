# AGENTS.md — Arbeitsregeln SCTTRD

## Vor jedem Push/Commit (Website & CMS)

1. **Erst lokal zeigen, dann pushen.** Vor jedem `git push` auf `main`:
   - `npm run build` (muss grün sein) + `npm test` (alle grün).
   - Lokalen Preview starten und die betroffenen Seiten dem User **lokal zum Anschauen geben**
     (`npm run preview -- --host 127.0.0.1 --port 4329` → http://127.0.0.1:4329/...).
   - **Auf explizites OK des Users warten**, erst dann committen/pushen.
   - Ausnahme: reine Doku-/README-Änderungen ohne Verhaltensänderung.

2. **Betroffene URLs immer nennen** (z. B. `/`, `/shows/<slug>/`, `/links/`, `/gallery/`),
   damit der User gezielt prüfen kann (auch Mobile-Breite).

3. Nach Push: CI-Run beobachten bis grün; bei Rot stoppen und melden.

## Konventionen (grob)

- Kein Commit von Secrets/Credentials; niemals Passwörter in Dateien schreiben.
- Tests laufen mit `npm test` = `node --experimental-strip-types --test tests/*.test.mjs` (kein Framework nötig).
- Domain-Vokabular siehe `CONTEXT.md`; Architektur-/Sprachregeln siehe `.agents/skills/improve-codebase-architecture/LANGUAGE.md`.
- Neuer Content (Shows/Links) wird laut Entscheidung **im CMS** gepflegt; lokale Markdowns sind Fallback.
- **Infrastruktur (SSH, Server, Secrets):** `docs/infra.md` — dort nachsehen, nichts neu erfinden.
- **Mail (Rider):** Architektur & Betrieb → `docs/mail-relay.md` (verweist auf `docs/infra.md`).

## Content-Workflow: Agent First

- Der User liefert nur Rohmaterial: einen kurzen Satz, eine URL und/oder eine Datei in `~/Downloads`. `/content <Beschreibung>` ist der Einstieg.
- Typen: **Show** (Collection `shows`, Identity `venue + city + date`) und **Release** (Collection `releases`, Identity `slug`).
- Recherchiere fehlende, öffentlich belegbare Angaben selbst aus offiziellen Quellen (Event-, Venue-, Ticket-, Label- und Artist-Seiten). Erfinde keine Fakten.
- Generiere selbst: Slug, Status (`upcoming`/`past` aus dem Datum), Release-Datum als `YYYY-MM-DD`, Alt-Texte, SEO-fähige Titel/Descriptions. Nach technischen CMS-Feldern nicht fragen.
- Beim **Anlegen** wird ein Release automatisch `status: published` gesetzt (nur Published liest die Website); bestehende Releases werden nie ungefragt veröffentlicht.
- Quellen-Pflicht: jeder Eintrag braucht mindestens eine `sources[].url` — das erzwingt der Import.
- Ablauf (Standard, alles in EINEM Lauf — Ziel: unter 2 Min. von der Idee zur Änderung):
  1. JSON-Input schreiben (Format unten).
  2. `npm run content:sync -- --input <datei.json>` → eine Plan-Zeile je Datensatz (`create`/`update`/`skip` + geänderte Felder), danach wird geschrieben, die öffentliche API verifiziert und die Live-URL gedruckt. Fehlschlag der Verifikation = Exit-Code 1.
  3. Gedruckte Live-URL prüfen (muss 200 sein).
  - Vorsichtsvariante, wenn der Plan unerwartetes zeigt: `npm run content:plan -- --input …` lesen, erst danach `npm run content:apply -- --input …` und `npm run content:verify` einzeln ausführen.
- Credentials: vorzugsweise `CMS_API_KEY` (Header `Authorization: users API-Key <key>` → kein Login, kein Passwort), sonst `CMS_URL`, `CMS_EMAIL`, `CMS_PASSWORD` (Fallback `SEED_EMAIL`/`SEED_PASSWORD`) aus `.env` oder Umgebung — niemals auslesen, loggen oder committen.
- Nur mitgelieferte Felder werden geändert; manuell im CMS editierte Werte bleiben beim erneuten Lauf unangetastet. Keine Duplikate: Identity-Felder sind der Schlüssel.
- **Vertrag CMS ↔ Import:** `tests/content-schema-contract.test.mjs` liest `Shows.ts`/`Releases.ts` und vergleicht sie mit `writableFields`. Neues CMS-Feld → Test rot → in `cms/scripts/content-import-lib.mjs` (`writableFields`, ggf. `deriveItem`) eintragen. Bei neuen Pflichtfeldern muss der Import es ableiten oder als Pflicht abfragen.
- **Vertrag API-Key:** `tests/cms-api-key.test.mjs` hält `auth.useAPIKey` in `cms/src/collections/Users.ts`, die additiven Migrationen `20261008_000000_add_users_api_key` + `20261008_000001_repair_users_api_key_columns` (Spalten `enable_a_p_i_key`/`api_key`/`api_key_index`) und den Auth-Flow des Imports fest: mit `CMS_API_KEY` kein Login, ohne Key weiterhin JWT via Passwort. Header-Format von Payload: `users API-Key <key>` (nicht `ApiKey`). Spaltennamen kommen aus `to-snake-case` (Unterstrich vor **jedem** Großbuchstaben, z. B. `enableAPIKey` → `enable_a_p_i_key`).
- Input-Format (ein Objekt oder Array davon):

```json
{
  "type": "show",
  "identity": {},
  "data": { "venue": "Techno & Punsch", "city": "Augsburg", "date": "12.12.2026", "link": "https://…" },
  "sources": [{ "url": "https://offizielle-quelle.de/event" }]
}
```

`identity` darf leer sein, wenn die Werte in `data` stehen. Bei Release genügt `title`; der `slug` wird erzeugt. `cover`/`image` dürfen ein lokaler Dateipfad sein (wird dann an `/api/media` hochgeladen) oder eine URL/`/images/…`-Pfad.
