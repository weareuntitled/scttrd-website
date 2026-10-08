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
4. JSON-Input schreiben (Format und Pflichtfelder: `AGENTS.md`).
5. **Ein Lauf schreibt und prüft:** `npm run content:sync -- --input <datei.json>` — zeigt pro Datensatz eine Plan-Zeile (`create`/`update`/`skip` mit Feld-Diff), führt den Plan aus, verifiziert die öffentliche API und druckt die Live-URL(s). Cover/Bild als lokalen Pfad angeben, der Import lädt es hoch. Ziel: von der Idee zur Änderung unter 2 Minuten — keine weiteren Befehle nötig.
6. Nur die gedruckte Live-URL ansehen (`curl -s -o /dev/null -w '%{http_code}' <url>` muss 200 sein). Nur wenn der Plan unerwartetes zeigt (z. B. `update` mit Feldern, die du nicht angefasst hast), erst `npm run content:plan` einzeln laufen lassen und nachfragen. Bei Codeänderungen zusätzlich `npm run build` und `npm test` nach `AGENTS.md`.

Frage nur einmal gesammelt nach, wenn eine veröffentlichungsrelevante Tatsache trotz Recherche unklar bleibt. Slug, Datum, Status, Alt-Texte und auffindbare Links sind keine Rückfragen. Zugangsdaten niemals auslesen oder in Dateien schreiben.
