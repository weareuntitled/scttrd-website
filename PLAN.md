# SCTTRD Production Polish

## Ziel

Payload soll als verlässliche Quelle für Home-Inhalte dienen. Die Startseite braucht eine kompaktere Show-Liste, eine pflegbare Galerie und funktionierende Video-Assets im Server-Deployment.

## Schritte

1. **Datenfluss prüfen und festlegen**
   - `Pages`-Collection für Home/About/Galerie verwenden.
   - Statisches Astro-Build bleibt bestehen; ein CMS-Update wird durch einen Web-Rebuild sichtbar.
   - Verifikation: Payload-API liefert den geänderten Home-Claim.

2. **Galerie umsetzen**
   - `src/pages/gallery.astro` erstellen.
   - Galerie-Bilder aus `Pages(slug=about).gallery` laden.
   - Fallback auf vorhandene lokale Bilder behalten.
   - Navigation auf `/gallery/` ergänzen.

3. **Show-Liste kompakter machen**
   - Maximale Breite und zentrierte Darstellung für die Listen setzen.
   - Mobile Darstellung unverändert brauchbar halten.

4. **Videos reparieren**
   - Video-Assets nicht mehr durch `.dockerignore` aus dem Web-Image ausschließen.
   - Vorhandene MP4/WebM/Poster-Pfade gegen den öffentlichen Server prüfen.

5. **Deploy und Verifikation**
   - Website-Image mit `PAYLOAD_URL` neu bauen.
   - HTTPS-Website, Galerie, Video-URLs, CMS und Docmost prüfen.
   - Änderungen und bekannte Einschränkung des statischen Builds dokumentieren.

6. **Lightweight Smoke-Test-CI/CD ergänzen**
   - GitHub Actions Workflow für Push auf `main` und manuellen Start anlegen.
   - CI: `npm ci`, `npm run build`, Galerie-Route und Video-Dateien im `dist`-Output prüfen.
   - Live-Smoke-Test: `curl -fsS` auf `/`, `/gallery/`, `/admin` und Docmost; Video-URL mit `curl -fsSI` auf `200`/`206` prüfen.
   - Nur nach erfolgreicher CI per SSH deployen: `git archive`/SCP der freigegebenen Dateien, dann `docker compose up -d --build` auf dem Server.
   - GitHub-Secrets verwenden: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `SERVER_KNOWN_HOSTS`, `DEPLOY_PATH`; niemals das Serverpasswort im Repository speichern.
   - Nach dem Deploy erneut Smoke-Tests ausführen und bei Fehlern den Workflow fehlschlagen lassen.
   - CMS-Änderungen bleiben statisch: Nach Payload-Änderungen muss ein Web-Build ausgelöst werden; ein Payload-Webhook kann später als separater Trigger ergänzt werden.
