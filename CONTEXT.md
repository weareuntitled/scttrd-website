# CONTEXT — SCTTRD Domain Language

| Begriff | Bedeutung | Notiz |
|---------|-----------|-------|
| Termin / Show | Ein Auftritt: Venue + Stadt + Datum + Bild + Status (upcoming/past). Quelle: `src/content/home/shows/*.md`, CMS `Termine`. | Kern der Startseite — wird nach deutschem Datum sortiert, fällt bei `t.b.a.` auf `order` zurück |
| Bento | 6-Kachel-Raster „on stage“: 1 Hero (Radio Rudina) + 2 Komod + 3 Reels (Wurzi). | Halb CMS (Reels), halb kuratiert |
| Hero | Startseiten-Aufmacher: 2 Bilder (links groß, rechts 30% kleiner) mit Headline SCTTRD | Bilder aus `homeImages` |
| Galerie | Bild-Liste auf /gallery (Quelle: `Pages(slug=about).gallery`, Fallback `aboutPageImages`) | Route `/gallery/` |
| Presse | Externe Links mit Cover | Unused auf Startseite |
| CTA Video | Großes Video vor Footer | `videos[0]` |
| Nächste Show | Früheste `upcoming` Termin / Show nach deutschem Datum (t.b.a. ignoriert); Badge „NEXT“ + oben fixiert | Quelle: `show.ts:nextShow`; Button immer zur Veranstaltungsseite `/shows/<slug>/` |
| Linkhub | Schwarze Seite `/links/` mit Avatar, Release-Kachel, Upcoming-Shows + externe Links | CMS-Global `Link Hub`; Vorschau + QR im Payload |
| Release | Ein Track mit Datum, Cover, Beschreibung und Streaming-/Pre-Save-Links. | CMS `Releases`; erzeugt `/releases/<slug>/` und steuert Linkhub sowie Homepage-Banner |
| Release-Banner | Optionale Promotion direkt unter der nächsten Show; vor Release sofort, danach standardmäßig 28 Tage. | Auswahl und Laufzeit in `release.ts`; kein Cronjob nötig |
| Link-Scrape | Beim Anlegen eines Links (Spotify/Soundcloud) Titel + Cover + Typ via oEmbed/OpenGraph ziehen | Wie Linktree; manuell überschreibbar |
| Tracking | Herkunft messen: `?utm_source=linkhub&utm_medium=...` an Ticket-Hrefs + Referrer | Funnel Links → Show → Ticket |
| Mail-Relay | PHP-Endpoint auf ALL-INKL; Netcup ruft per HTTP an, Relay sendet per SMTP | `docs/mail-relay.md`; SSH/Secrets → `docs/infra.md` |
| Rider-Gate | HTML-Rider frei; PDF + Hospitality nach Formular auf `/styleguide/#rider` | API `/api/rider-request`; Anfragen im CMS `rider-requests` |
