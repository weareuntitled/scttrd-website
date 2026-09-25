# Mail-Relay (Rider-Benachrichtigungen)

> **SSH, `.env`, FTP, Secrets:** nicht hier neu eintragen → **`docs/infra.md`**

Stand: 2026-09-25

## Entscheidung

**Problem:** Netcup blockiert ausgehend SMTP **25 / 465 / 587** → direkter Versand vom VPS
scheitert mit `ETIMEDOUT` (siehe `docs/infra.md` für SSH/Server).

**Lösung:** PHP-Relay auf **ALL-INKL**; Netcup ruft per **HTTP** an, Relay sendet per SMTP.

**Noch offen:** CMS-Passwort-Reset und Wiki-Einladungen (direktes SMTP in `compose.all.yaml`) —
vom VPS aus noch blockiert.

---

## Architektur

```text
/styleguide/#rider  →  POST /api/rider-request  (Netcup, Astro)
       →  HTTP + Bearer  →  ALL-INKL …/mail-relay/send.php
       →  SMTP 587  →  info@scttrd.de  (+ CMS rider-requests)
```

Live-URL und Secret: **`MAIL_RELAY_URL` / `MAIL_RELAY_SECRET`** in Server-`.env`
(nachsehen laut `docs/infra.md`).

**URL-Falle:** Web auf ALL-INKL läuft unter **`scttrd.de.w021c25a.kasserver.com`**, nicht
unter `w021c25a.kasserver.com` allein (404). HTTP ist OK (kein passendes TLS-Zertifikat).

---

## Code im Repo

| Pfad | Rolle |
|------|--------|
| `all-inclusive/mail-relay/send.php` | Relay-Endpoint |
| `all-inclusive/mail-relay/config.example.php` | Vorlage → `config.php` auf ALL-INKL |
| `scripts/deploy-mail-relay.mjs` | FTP-Upload (Credentials aus `~/Desktop/0.env`) |
| `src/lib/riderMail.ts` | Relay wenn `MAIL_RELAY_URL` gesetzt |
| `all-inclusive/compose.all.yaml` | Env an Web-Container |
| `all-inclusive/.env.example` | Key-Namen |

---

## Betrieb (Kurz)

**Relay aktualisieren**

```bash
node scripts/deploy-mail-relay.mjs
```

Liest `ftp_*` und `EMAIL_PWD` aus `~/Desktop/0.env`. FTP-Details → `docs/infra.md`.

**Web nach Env-Änderung**

```bash
ssh -i ~/.ssh/scttrd-server root@89.58.27.240 \
  'cd /opt/scttrd/all-inclusive && docker compose -f compose.all.yaml up -d --build web'
```

**Smoke-Tests**

```bash
# 1) Secret vom Server holen, dann Relay testen:
SECRET=$(ssh -i ~/.ssh/scttrd-server root@89.58.27.240 "grep ^MAIL_RELAY_SECRET= /opt/scttrd/all-inclusive/.env | cut -d= -f2-")
URL=$(ssh -i ~/.ssh/scttrd-server root@89.58.27.240 "grep ^MAIL_RELAY_URL= /opt/scttrd/all-inclusive/.env | cut -d= -f2-")

curl -sS -X POST "$URL" \
  -H "Authorization: Bearer $SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"to":"info@scttrd.de","replyTo":"test@example.com","subject":"Relay-Test","text":"OK","html":"<p>OK</p>"}'

# 2) Website
curl -sS -H 'accept: application/json' -H 'content-type: application/json' \
  -d '{"name":"Test","venue":"Test","email":"test@example.com"}' \
  https://scttrd.de/api/rider-request
# → "emailSent": true
```

Seite: https://scttrd.de/styleguide/#rider

---

## Fehlerbilder

| Symptom | Fix |
|---------|-----|
| `emailSent: false`, ~8 s | `MAIL_RELAY_URL` in Server-`.env`, Web rebuild |
| Relay 401 | `MAIL_RELAY_SECRET` ↔ `config.php` auf ALL-INKL |
| Relay 404 | URL muss `scttrd.de.w021c25a.kasserver.com` enthalten |
| FTP 530 | FTP-User aus KAS / `ftp_user_allinkl` in `0.env`, nicht KAS-Login `w021c25a` |
