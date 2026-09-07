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
