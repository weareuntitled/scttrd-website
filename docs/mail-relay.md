# Mail-Relay (Rider-Benachrichtigungen)

Stand: 2026-09-25

## Entscheidung

**Problem:** Der Netcup-VPS (`89.58.27.240`, `happysrv.de`) blockiert ausgehend **SMTP 25, 465 und 587**.
Direkter Versand aus Website, CMS oder Wiki zu ALL-INKL (`w021c25a.kasserver.com`) schlägt mit
`Connection timeout (ETIMEDOUT)` fehl — obwohl Host, Benutzer und Passwort korrekt sind.

**Lösung (Rider-Mails):** Kleiner **PHP-Relay auf ALL-INKL** (Shared Hosting, SMTP erreichbar).
Der Netcup-VPS ruft den Relay per **HTTP** auf; der Relay sendet lokal per SMTP an `info@scttrd.de`.

**Bewusst nicht gewählt (Stand heute):**

| Option | Warum nicht |
|--------|-------------|
| SaaS (Resend, Brevo, …) | Kein Wunsch nach externem Dienst; Postfach liegt schon bei ALL-INKL |
| Postern / Hyvor Relay auf zweitem VPS | Overkill für wenige Rider-Mails |
| Netcup SMTP freischalten | Möglich, aber Support-Ticket — Relay war schneller live |

**Noch offen:** CMS-Passwort-Reset und Wiki-Einladungen nutzen weiterhin **direktes SMTP** in
`compose.all.yaml` — funktioniert vom VPS aus **noch nicht**, bis Netcup freischaltet oder ein
zweites Relay kommt.

---

## Architektur

```text
Besucher → scttrd.de/styleguide/#rider (Netcup)
              │  POST /api/rider-request
              ▼
         Web-Container (Astro)
              │  HTTP POST + Bearer-Token
              ▼
    ALL-INKL PHP-Relay (SMTP erreichbar)
    http://scttrd.de.w021c25a.kasserver.com/mail-relay/send.php
              │  SMTP 587 / STARTTLS
              ▼
         info@scttrd.de  (+ Kopie im CMS: rider-requests)
```

---

## Wo was liegt (Repo)

| Pfad | Inhalt |
|------|--------|
| `docs/mail-relay.md` | Diese Datei — Entscheidungen, URLs, Betrieb |
| `all-inclusive/mail-relay/send.php` | Relay-Endpoint (POST, JSON, Bearer-Auth) |
| `all-inclusive/mail-relay/config.example.php` | Vorlage für `config.php` auf ALL-INKL |
| `all-inclusive/mail-relay/.gitignore` | `config.php` nie committen |
| `scripts/deploy-mail-relay.mjs` | FTP-Upload nach ALL-INKL |
| `src/lib/riderMail.ts` | Website: Relay wenn `MAIL_RELAY_URL` gesetzt, sonst SMTP-Fallback |
| `src/pages/api/rider-request.ts` | Rider-Gate-API; ruft `sendRiderNotification()` |
| `all-inclusive/compose.all.yaml` | `MAIL_RELAY_URL` / `MAIL_RELAY_SECRET` für Web-Container |
| `all-inclusive/.env.example` | Variablennamen + Verweis hierher |
| `tests/mail.test.mjs`, `tests/riderGate.test.mjs` | Verdrahtung und Doku-Checks |

---

## Wo was liegt (Produktion)

| Ort | Inhalt |
|-----|--------|
| **Netcup VPS** `root@89.58.27.240` | Docker-Stack unter `/opt/scttrd/all-inclusive/` |
| `/opt/scttrd/all-inclusive/.env` | `MAIL_RELAY_URL`, `MAIL_RELAY_SECRET`, SMTP, DB-Secrets (**nicht in Git**) |
| **ALL-INKL FTP** `f018d3d2@w021c25a.kasserver.com` | Webroot: `/mail-relay/send.php`, `/mail-relay/config.php` |
| **Relay-URL (live)** | `http://scttrd.de.w021c25a.kasserver.com/mail-relay/send.php` |
| **Postfach** | `info@scttrd.de` @ `w021c25a.kasserver.com` |
| **Secrets lokal** | `~/Desktop/0.env`: `EMAIL_PWD`, `ftp_pwd_allinkl`, optional `ftp_user_allinkl=f018d3d2` |

**Wichtig zur URL:** `https://w021c25a.kasserver.com/...` liefert 404 — Web läuft unter der
KAS-Subdomain **`scttrd.de.w021c25a.kasserver.com`**. HTTPS dort hat kein passendes Zertifikat;
Server-zu-Server per **HTTP** ist OK.

---

## Umgebungsvariablen (Netcup `.env`)

```env
# Rider-Benachrichtigungen — Pflicht für Mailversand vom VPS
MAIL_RELAY_URL=http://scttrd.de.w021c25a.kasserver.com/mail-relay/send.php
MAIL_RELAY_SECRET=<gleicher Wert wie relay_secret in config.php auf ALL-INKL>
RIDER_MAIL_TO=info@scttrd.de

# CMS + Wiki — erst relevant, wenn SMTP vom VPS aus geht
SMTP_HOST=w021c25a.kasserver.com
SMTP_PORT=587
SMTP_USER=info@scttrd.de
SMTP_PASSWORD=<Postfach-Passwort>
MAIL_FROM_ADDRESS=info@scttrd.de
```

Nach Änderung: `docker compose -f compose.all.yaml up -d --build web`

---

## ALL-INKL: Relay deployen / aktualisieren

1. `config.php` auf dem Server anlegen (von `config.example.php`), **nicht ins Git**:
   - `relay_secret` = identisch mit `MAIL_RELAY_SECRET` auf Netcup
   - `smtp_password` = Postfach-Passwort (`EMAIL_PWD` in `~/Desktop/0.env`)
2. Upload per FTP oder Deploy-Skript:

```bash
# ftp_user_allinkl=f018d3d2 und ftp_pwd_allinkl=… in ~/Desktop/0.env
node scripts/deploy-mail-relay.mjs
```

3. Smoke-Test Relay direkt:

```bash
curl -sS -X POST 'http://scttrd.de.w021c25a.kasserver.com/mail-relay/send.php' \
  -H 'Authorization: Bearer <MAIL_RELAY_SECRET>' \
  -H 'Content-Type: application/json' \
  -d '{"to":"info@scttrd.de","replyTo":"test@example.com","subject":"Relay-Test","text":"OK","html":"<p>OK</p>"}'
# Erwartung: {"ok":true}
```

4. Smoke-Test Website:

```bash
curl -sS -H 'accept: application/json' -H 'content-type: application/json' \
  -d '{"name":"Test","venue":"Test","email":"test@example.com"}' \
  https://scttrd.de/api/rider-request
# Erwartung: "emailSent":true
```

Betroffene Seite: **https://scttrd.de/styleguide/#rider**

---

## Sicherheit

- `config.php` und `.env` enthalten Secrets — **nie committen**
- Relay akzeptiert nur `POST`, prüft Bearer-Token, erlaubt nur Empfänger aus `allowed_to`
  (derzeit nur `info@scttrd.de`)
- FTP-Passwort ≠ KAS-Login `w021c25a` — FTP-User ist **`f018d3d2`** (eigener FTP-Nutzer im KAS)

---

## Fehlerbilder

| Symptom | Ursache | Fix |
|---------|---------|-----|
| `emailSent: false`, ~8 s | VPS versucht noch direktes SMTP | `MAIL_RELAY_URL` in `.env`, Web neu bauen |
| Relay 401 | Secret mismatch | `MAIL_RELAY_SECRET` ↔ `config.php` abgleichen |
| Relay 404 | Falsche Host-URL | `scttrd.de.w021c25a.kasserver.com` verwenden |
| FTP 530 | Falscher FTP-User | `f018d3d2`, nicht `w021c25a` |
| CMS/Wiki-Mail geht nicht | SMTP vom VPS blockiert | Netcup anfragen oder zweites Relay |
