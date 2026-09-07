# SCTTRD Production Polish

## Ziel

Payload soll als verlässliche Quelle für Home-Inhalte dienen. Website, CMS und Wiki laufen direkt auf dem Server. Die Startseite braucht eine kompaktere Show-Liste, eine pflegbare Galerie und funktionierende Video-Assets im Server-Deployment.

## Schritte

1. **Datenfluss prüfen und festlegen**
   - `Pages`-Collection für Home/About/Galerie verwenden.
   - Website läuft mit Astro Node SSR; ein CMS-Update ist beim nächsten Seitenaufruf sofort sichtbar.
   - Verifikation: Payload-API liefert den geänderten Home-Claim.

2. **Galerie umsetzen**
   - `src/pages/gallery.astro` erstellen.
   - Galerie-Bilder aus `Pages(slug=about).gallery` laden.
   - Fallback auf vorhandene lokale Bilder behalten.
   - Navigation auf `/gallery/` ergänzen.

3. **Show-Mini-Landingpages**
   - Jede Show bekommt unter `/shows/<venue-datum>/` eine eigene Seite.
   - Upcoming-Shows zeigen den Ticketlink als primären CTA.
   - Verifikation: Show-Link aus der Tabelle und Ticketlink funktionieren.

4. **Show-Liste kompakter machen**
   - Maximale Breite und zentrierte Darstellung für die Listen setzen.
   - Mobile Darstellung unverändert brauchbar halten.

5. **Videos reparieren**
   - Video-Assets nicht mehr durch `.dockerignore` aus dem Web-Image ausschließen.
   - Vorhandene MP4/WebM/Poster-Pfade gegen den öffentlichen Server prüfen.

6. **Deploy und Verifikation**
   - Website-Image mit `PAYLOAD_URL` neu bauen.
   - HTTPS-Website, Galerie, Video-URLs, CMS und Docmost prüfen.
   - Änderungen und bekannte Einschränkung des statischen Builds dokumentieren.

7. **Lightweight Smoke-Test-CI/CD ergänzen**
   - GitHub Actions Workflow für Push auf `main` und manuellen Start anlegen.
   - CI: `npm ci`, `npm run build`, Galerie-Route und Video-Dateien im `dist`-Output prüfen.
   - Live-Smoke-Test: `curl -fsS` auf `/`, `/gallery/`, `/admin` und Docmost; Video-URL mit `curl -fsSI` auf `200`/`206` prüfen.
   - Nur nach erfolgreicher CI per SSH deployen: `git archive`/SCP der freigegebenen Dateien, dann `docker compose up -d --build` auf dem Server.
   - GitHub-Secrets verwenden: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `SERVER_KNOWN_HOSTS`, `DEPLOY_PATH`; niemals das Serverpasswort im Repository speichern.
   - Nach dem Deploy erneut Smoke-Tests ausführen und bei Fehlern den Workflow fehlschlagen lassen.
   - Der CI/CD-Workflow deployt Codeänderungen; CMS-Inhalte benötigen keinen Rebuild.

8. **Vercel vollständig entfernen**
   - `vercel.json` und CMS-Vercel-Konfiguration löschen.
   - Apex-Domain und Subdomains auf den Server zeigen lassen.
   - Vercel-Projekt im Dashboard deaktivieren/löschen, sobald die Live-Prüfung grün ist.

9. **Optionale Plattform-Integrationen**
   - Spotify-Konzertdaten über einen unterstützten Konzertpartner pflegen; die normale Spotify-Web-API kann keine Artist-Events schreiben.
   - Linktree nur über eine verfügbare offizielle API/Automation aktualisieren.
   - Erst nach vorhandenen API-Zugängen und klarer Berechtigung implementieren.

10. **SEO-Grundlagen automatisieren**
    - Gemeinsame SEO-Komponente für Startseite, About, Galerie und Show-Seiten einführen: Title, Description, Canonical, Open Graph und Twitter Card.
    - `sitemap.xml` und `robots.txt` automatisch aus den tatsächlich öffentlichen Astro-Routen erzeugen.
    - Startseite auf `lang="de"` korrigieren und kaputte Webflow-Links auf echte Astro-Routen umstellen.
    - Aus den vorhandenen Show-Feldern automatisch individuelle Seitentitel, Beschreibungen und `Event`-Schema-Daten erzeugen.
    - Für die Band automatisch `MusicGroup`-Schema mit Name, Website, Social Links, Genre und Herkunft ausgeben. Keine unbestätigten Beziehungen zu anderen Artists behaupten.

11. **Sound-Profil für bessere Artist-Relevanz**
    - Einmalig ein kurzes, natürlich formuliertes Sound-Profil ergänzen: `Live Techno`, `Post-Punk`, `Trance`, deutsche und englische Vocals, Synths, Drums, Augsburg.
    - Optional 5–8 echte Referenz-Artists aus dem bestehenden musikalischen Umfeld hinterlegen. Nur Artists verwenden, deren Einfluss oder klangliche Nähe SCTTRD tatsächlich vertreten kann.
    - Diese Referenzen als redaktionellen Satz auf About oder Startseite ausspielen, nicht als Keyword-Liste: „Für Fans von …“ nur bei ehrlicher musikalischer Nähe.
    - Keine eigene Artist-Unterseite pro Referenz anlegen. Das würde dünne, künstliche SEO-Seiten erzeugen.
    - Den gleichen Sound-Kern einmalig und konsistent in Spotify, SoundCloud, Instagram, Linktree, Pressekit und Veranstalterprofilen verwenden. Das stärkt die Zuordnung zu Genres und ähnlichen Artists stärker als zusätzliche Website-Texte.

12. **Interne und externe Signale nutzen**
    - Von der Startseite, About-Seite und dem Pressekit auf kommende Show-Seiten verlinken; Show-Seiten zurück auf Bandprofil und Booking verlinken.
    - Venue- und Festivalveranstalter bitten, auf die passende SCTTRD-Showseite statt nur auf Instagram zu verlinken.
    - Google Search Console nach dem technischen Rollout einrichten und monatlich nur Suchanfragen, Impressionen, Klicks und indexierte Seiten prüfen.
    - Erfolg nicht an Ranking für einzelne Artist-Namen messen, sondern an Suchanfragen wie `live techno Augsburg`, `Post-Punk Techno Band`, `Techno Band buchen` und passenden Venue-/Festival-Suchen.

13. **Verifikation SEO und Artist-Matching**
    - Build muss Sitemap, Canonicals, valide Meta-Daten und eine funktionierende Seite für jede Show erzeugen.
    - Rich Results Test für `Event`- und Schema.org-Ausgaben ausführen.
    - Mit Search Console und manuellen Suchtests prüfen, ob die relevanten Begriffe und Referenz-Artists im sichtbaren Kontext vorkommen.
    - Nach 6–8 Wochen prüfen, welche Suchbegriffe tatsächlich Impressionen erzeugen; nur bestehende Texte gezielt nachschärfen, keine Content-Menge um ihrer selbst willen erhöhen.

14. **Gemeinsame Line-ups als einmalige Backlink-Chance**
    - Für vergangene Veranstaltungen einmalig die öffentlich belegbaren Line-ups recherchieren und pro Show ein optionales `lineup`-Feld sowie `sourceUrl` ergänzen. Keine Artists erfinden oder aus unbestätigten Posts übernehmen.
    - Auf der jeweiligen Show-Seite einen kurzen „Gemeinsam aufgetreten mit“-Abschnitt ausgeben. Jeder Artist wird nur auf sein offizielles Profil oder seine offizielle Website verlinkt.
    - Venue-, Festival- und Veranstalterseiten zuerst als Backlink-Ziele priorisieren, weil dort die gemeinsame Veranstaltung bereits dokumentiert ist.
    - Nach der Veröffentlichung eine kurze, persönliche Nachricht an Veranstalter und passende Artists senden: fertige SCTTRD-Showseite anbieten und um Ergänzung/Korrektur des Line-up-Links bitten.
    - Keine Linktausch-Versprechen, Massenmails, Artist-Namenslisten oder automatisch erzeugte „SCTTRD meets …“-Seiten verwenden. Relevanz entsteht durch den belegten gemeinsamen Auftritt.
    - Backlinks und Quellen in einer kleinen Tabelle dokumentieren: Domain, Show, Kontakt, Status, Linkziel und Datum der letzten Anfrage.
    - Erfolg nach 8–12 Wochen anhand verweisender Domains, qualifizierter Impressionen und Klicks messen, nicht anhand der bloßen Anzahl versendeter Anfragen.
