# SCTTRD CMS · Go-Live (nächste Woche)

Website-Stand: **Astro (Vercel) + Payload-CMS (VPS)**. Die Startseite liest die Shows beim Build
über `PAYLOAD_URL` aus dem CMS; schlägt der Fetch fehl, nutzt sie weiter die lokalen Markdown-Fallback
(`src/content`). Damit kann die Website niemals durch das CMS brechen.

## 1 · DNS

Beim Registrar von `scttrd.de` einen Eintrag anlegen:

| Typ | Name | Wert |
|---|---|---|
| `A` | `cms` | `<VPS-IP-Adresse>` |

Prüfen: `nslookup cms.scttrd.de`

## 2 · Stack auf den VPS

```bash
mkdir -p /opt/scttrd-cms && cd /opt/scttrd-cms
# Ordner cms/ hierher kopieren (Dockerfile, Caddyfile, compose.prod.yaml, src, package*.json …)

cp .env.example .env
openssl rand -hex 32          # -> PAYLOAD_SECRET
# .env: PAYLOAD_SECRET + POSTGRES_PASSWORD setzen. DATABASE_URL/PAYLOAD_PUBLIC_SERVER_URL
#       werden im Compose passend überschrieben (cms.scttrd.de).

docker compose -f compose.prod.yaml --profile proxy up -d --build
docker compose -f compose.prod.yaml ps
```

Caddy holt automatisch das Let's-Encrypt-Zertifikat für `cms.scttrd.de`.

## 3 · Erster Start & Daten

1. `https://cms.scttrd.de/admin` öffnen → **ersten Admin-User** anlegen
   (z. B. `admin@scttrd.de` / sicheres Passwort).
2. Shows aus den Markdown-Content seeden (auf dem VPS oder lokal mit `PAYLOAD_URL`):

```bash
# VPS/auth: User per env (SEED_EMAIL/SEED_PASSWORD/PAYLOAD_URL), sonst Login-Frage.
cd /opt/scttrd-cms
node scripts/seed-payload.mjs   # sofern scripts/ mitkopiert wurde
```

   Alternativ Shows manuell im Admin anlegen (Media-Hochladen + Shows).
3. Schema wird beim Start automatisch gepusht (`PAYLOAD_PUSH=true`).

## 4 · Vercel (Website) anbinden

In Vercel → Projekt `scttrd-website` → **Environment Variables**:

| Variable | Wert |
|---|---|
| `PAYLOAD_URL` | `https://cms.scttrd.de` |

Danach einmal neu deployen — die Startseite baut dann mit den Shows aus dem CMS.
(Ohne Variable bleibt sie auf den Markdown-Fallback — kein Risiko.)

## 5 · Backup (wöchentlich)

```bash
cd /opt/scttrd-cms
docker compose -f compose.prod.yaml exec -T db pg_dump -U cms scttrd_cms > cms_$(date +%F).sql
```

## Lokal (Dev)

```bash
# CMS: Postgres läuft (z. B. scttrd-cms-db auf 5433), dann:
cd cms && npm run dev            # http://localhost:3000/admin

# Website:
# (eigener Astro-Dev auf 4321; PAYLOAD_URL optional)
npm run dev                      # http://localhost:4321
```