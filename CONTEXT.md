# CONTEXT — SCTTRD Domain Language

| Begriff | Bedeutung | Notiz |
|---------|-----------|-------|
| Termin / Show | Ein Auftritt: Venue + Stadt + Datum + Bild + Status (upcoming/past). Quelle: `src/content/home/shows/*.md`, CMS `Termine`. | Kern der Startseite — wird nach deutschem Datum sortiert, fällt bei `t.b.a.` auf `order` zurück |
| Bento | 6-Kachel-Raster „on stage“: 1 Hero (Radio Rudina) + 2 Komod + 3 Reels (Wurzi). | Halb CMS (Reels), halb kuratiert |
| Hero | Startseiten-Aufmacher: 2 Bilder (links groß, rechts 30% kleiner) mit Headline SCTTRD | Bilder aus `homeImages` |
| Galerie | Bild-Liste auf /about | — |
| Presse | Externe Links mit Cover | Unused auf Startseite |
| CTA Video | Großes Video vor Footer | `videos[0]` |
