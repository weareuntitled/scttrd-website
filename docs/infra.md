# Infrastruktur — Nachschlageregister

**Regel:** Passwörter, Tokens und live gesetzte Secrets **nicht** in Chat, Commits oder diese Datei
schreiben. Hier stehen nur **wo** etwas liegt und **welche Keys** es gibt.

---

## SSH (Netcup VPS)

| Was | Wo |
|-----|-----|
| Privater Key (lokal) | `~/.ssh/scttrd-server` |
| Login | `ssh -i ~/.ssh/scttrd-server root@89.58.27.240` |
| Hostname | `v2202609413577515286.happysrv.de` |
| Deploy-Pfad auf dem Server | `/opt/scttrd` (Compose: `/opt/scttrd/all-inclusive/`) |
| CI-Deploy | `.github/workflows/deploy.yml` — Secrets `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `SERVER_KNOWN_HOSTS`, `DEPLOY_PATH` |

Typische Befehle:

```bash
ssh -i ~/.ssh/scttrd-server root@89.58.27.240
cd /opt/scttrd/all-inclusive && docker compose -f compose.all.yaml ps
```

---

## Secrets & Konfiguration (live)

| Was | Wo nachsehen |
|-----|----------------|
| **Alle Produktions-Env-Vars** (DB, Mail, Relay, …) | `/opt/scttrd/all-inclusive/.env` auf dem VPS |
| Key-Namen (ohne Werte) | `all-inclusive/.env.example` im Repo |
| Lokale Secrets (Daniel) | `~/Desktop/0.env` |

Bekannte Keys in `~/Desktop/0.env` (Werte dort, nicht im Git):

| Key | Wofür |
|-----|--------|
| `EMAIL_PWD` | Postfach `info@scttrd.de` (SMTP + Relay `config.php`) |
| `ftp_user_allinkl` | ALL-INKL FTP-Benutzer (KAS → FTP, nicht KAS-Login) |
| `ftp_pwd_allinkl` | ALL-INKL FTP-Passwort |

Live-Werte vom Server lesen (Beispiel Relay):

```bash
ssh -i ~/.ssh/scttrd-server root@89.58.27.240 \
  'grep -E "^MAIL_RELAY_" /opt/scttrd/all-inclusive/.env'
```

---

## ALL-INKL (Mail + Relay-Hosting)

| Was | Wo nachsehen |
|-----|----------------|
| KAS / technische Verwaltung | [kas.all-inkl.com](https://kas.all-inkl.com) |
| SMTP-Host | Key `SMTP_HOST` in Server-`.env` (typisch `w021c25a.kasserver.com`) |
| FTP-Host | gleicher KAS-Host |
| FTP-User / -Passwort | `ftp_user_allinkl`, `ftp_pwd_allinkl` in `~/Desktop/0.env` |
| Relay-PHP (deployed) | FTP-Pfad `/mail-relay/` → URL siehe `MAIL_RELAY_URL` in Server-`.env` |
| Relay deployen | `node scripts/deploy-mail-relay.mjs` (liest `~/Desktop/0.env`) |

Mail-Architektur & Fehlerbilder: **`docs/mail-relay.md`**

---

## Domains & DNS

| Service | URL |
|---------|-----|
| Website | https://scttrd.de |
| CMS | https://cms.scttrd.de/admin |
| Wiki | https://docs.scttrd.de |
| Rider (Gate) | https://scttrd.de/styleguide/#rider |

DNS-Referenz (A-Records etc.): `scttrd.de.server-dns.txt`

---

## Nach Deploy

```bash
# Build + Tests lokal (vor Push)
npm run build && node --experimental-strip-types --test tests/*.test.mjs

# Web-Container neu bauen (auf dem Server)
ssh -i ~/.ssh/scttrd-server root@89.58.27.240 \
  'cd /opt/scttrd/all-inclusive && docker compose -f compose.all.yaml up -d --build web'
```

CI beobachten: GitHub Actions → Workflow „Build, Smoke Test and Deploy“.
