---
description: Recherchiert und veröffentlicht SCTTRD-Content (Shows & Releases) aus einem Satz, Link oder einer Datei.
agent: build
---

Pflege folgenden Inhalt für scttrd.de vollständig und möglichst ohne Rückfragen ein:

$ARGUMENTS

Arbeite nach `AGENTS.md`, besonders "Content-Workflow: Agent First". Bestimme zuerst den Typ (Show oder Release) und suche nach genannten oder offensichtlich passenden Dateien in `~/Downloads`.

Pflichtablauf:

1. Bestehenden CMS-Datensatz suchen, damit nichts dupliziert wird (`content:plan` zeigt create/update/skip).
2. Offizielle Quellen recherchieren und Fakten gegeneinander prüfen. Offizielle Event-, Venue-, Ticket- und Label-Seiten vor Aggregatoren bevorzugen.
3. Technische Inhalte selbst erzeugen: Slug, Datum/Status (`upcoming`/`past`), Release-Datum als `YYYY-MM-DD`, Alt-Texte, Links. Das sind keine Rückfragen.
4. JSON-Input schreiben (Format und Pflichtfelder: `AGENTS.md`), dann `npm run content:plan -- --input <datei.json>` und den Plan prüfen.
5. Nach plausibelem Plan `npm run content:apply -- --input <datei.json>` ausführen; Cover/Bild als lokalen Pfad angeben, der Import lädt es hoch.
6. `npm run content:verify` plus betroffene öffentliche Seite (`/`, `/shows/<slug>/`, `/releases/<slug>/`, `/links/`) prüfen. Bei Codeänderungen zusätzlich `npm run build` und `npm test` nach `AGENTS.md`.

Frage nur einmal gesammelt nach, wenn eine veröffentlichungsrelevante Tatsache trotz Recherche unklar bleibt. Slug, Datum, Status, Alt-Texte und auffindbare Links sind keine Rückfragen. Zugangsdaten niemals auslesen oder in Dateien schreiben.
