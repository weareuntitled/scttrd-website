# AGENTS.md — Arbeitsregeln SCTTRD

## Vor jedem Push/Commit (Website & CMS)

1. **Erst lokal zeigen, dann pushen.** Vor jedem `git push` auf `main`:
   - `npm run build` (muss grün sein) + `node --test tests/*.test.mjs` (alle grün).
   - Lokalen Preview starten und die betroffenen Seiten dem User **lokal zum Anschauen geben**
     (`npm run preview -- --host 127.0.0.1 --port 4329` → http://127.0.0.1:4329/...).
   - **Auf explizites OK des Users warten**, erst dann committen/pushen.
   - Ausnahme: reine Doku-/README-Änderungen ohne Verhaltensänderung.

2. **Betroffene URLs immer nennen** (z. B. `/`, `/shows/<slug>/`, `/links/`, `/gallery/`),
   damit der User gezielt prüfen kann (auch Mobile-Breite).

3. Nach Push: CI-Run beobachten bis grün; bei Rot stoppen und melden.

## Konventionen (grob)

- Kein Commit von Secrets/Credentials; niemals Passwörter in Dateien schreiben.
- Tests laufen mit `node --test tests/*.test.mjs` (kein Framework nötig).
- Domain-Vokabular siehe `CONTEXT.md`; Architektur-/Sprachregeln siehe `.agents/skills/improve-codebase-architecture/LANGUAGE.md`.
- Neuer Content (Shows/Links) wird laut Entscheidung **im CMS** gepflegt; lokale Markdowns sind Fallback.
