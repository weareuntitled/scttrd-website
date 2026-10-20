# Prompt: News und Live-Recaps für SCTTRD

Kopiere diesen Prompt und ergänze am Ende deine Notizen, Links und Bilddateien:

```text
Erstelle einen News- oder Live-Recap-Beitrag für die SCTTRD-Website.

Arbeitsweise
1. Recherchiere zuerst im Web. Nutze möglichst offizielle Quellen: Veranstalter,
   Venue, Festival, Radio, Ticketseite und beteiligte Artists. Öffne die Quellen,
   prüfe widersprüchliche Angaben und verwende konkrete, belegbare Fakten.
2. Behandle meine Notizen als Quelle für unsere eigenen Erlebnisse, Set-Reihenfolge,
   Publikumseindruck und Stimmung. Nicht von Quellen belegte Fakten nicht als
   Recherche-Fakten ausgeben.
3. Wenn eine für den Beitrag wichtige Angabe fehlt oder widersprüchlich ist, frage
   kurz nach, statt zu raten oder den Text mit Allgemeinplätzen aufzufüllen.
4. Schreibe in SCTTRDs direkter, lockerer Bandstimme. Der Beitrag soll wie ein
   echter Rückblick wirken, nicht wie eine Pressemitteilung oder SEO-Text.

Inhaltliche Qualitätsregeln
- Ziel: 250–450 Wörter, mindestens 1.200 Zeichen im Artikeltext.
- Beginne mit dem konkreten Moment, Ort oder Erlebnis, das diesen Gig besonders
  gemacht hat. Ergänze danach Ablauf/Set, Publikum und ein persönliches Fazit,
  soweit die Notizen dafür Material liefern.
- Verwende den Eventnamen, Stadt, Datum und Venue natürlich im Titel, Teaser oder
  Text. Keine Keyword-Wiederholungen und keine bloße Wiederholung des Show-Eintrags.
- Setlist nur aus meiner Liste übernehmen. Reihenfolge nur nennen, wenn bestätigt.
- Keine Crowd-Größe, Uhrzeit, Spielzeit, Acts, Zitate, Reaktionen, technischen
  Details oder Begegnungen erfinden. Schätzungen als Schätzung kennzeichnen.
- Wenn das Rohmaterial keine 1.200 wahrheitsgemäßen Zeichen trägt: erst gezielt
  nach persönlichen Erinnerungen fragen. Nicht künstlich verlängern.
- Verwende nur bereitgestellte Fotos oder Fotos, deren Nutzung freigegeben ist.
  Beschreibe jedes Bild konkret und sachlich im Alt-Text; Fotocredit nur nach
  Angabe oder belegbarer Dateiquelle setzen.
- Veranstaltungs-, Recording- und Artist-Links prüfen. Recording als Audio oder
  Video unterscheiden. Quellen intern im CMS speichern; nicht als erfundene
  Zitate oder Empfehlungen ausgeben.

Liefere zum Schluss:
1. Einen kurzen Quellen-/Faktencheck mit URLs und allen offenen Punkten.
2. Den fertigen Inhalt als JSON-Datei für `npm run content:sync -- --input …`
   im Format der News-Collection. Artikel erst mit `status: "published"`
   veröffentlichen, wenn ich ausdrücklich darum bitte; ansonsten `draft`.
3. Weise im Report darauf hin, wenn persönliche Infos oder Bildrechte noch
   bestätigt werden müssen.

Meine Notizen, Links und Dateien:
[HIER EINFÜGEN]
```

## Erwartete Daten

`type: "news"`, `category: "live-recap" | "news"`, Titel und Slug, Teaser bis
180 Zeichen, Artikeltext ab 1.200 Zeichen, Veröffentlichungsdatum als `YYYY-MM-DD`,
Status, Titelbild, optionale Fotos mit Alt-Text/Credit, optionale Setlist,
zugehörige Show-ID, Event-/Recording-URLs und recherchierte `sources[].url`.

Jeder Beitrag braucht mindestens eine Quelle. Die CMS-API lädt Titelbild und
Fotogalerie aus lokalen Dateien oder `/images/...`-Pfaden hoch und speichert die
Recherchequellen intern für spätere Faktenprüfungen.
