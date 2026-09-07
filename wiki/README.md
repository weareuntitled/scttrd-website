# SCTTRD Wiki — Docmost auf docs.scttrd.de

Selbst-gehostetes Squad-/Band-Wiki (Docmost, open source AGPL) auf einem eigenen Server/VPS.
Website, CMS und Wiki laufen gemeinsam auf dem eigenen Server.

```
docs.scttrd.de
   │  A-Record / CNAME  →  VPS
   ▼
Caddy (Port 80/443, auto-HTTPS via Let's Encrypt)
   │  reverse_proxy
   ▼
docmost:3000  ──▶  Redis (Cache/Sessions/Queues)
   │
   └────────┴▶  Postgres 18 (Daten)
```

## Voraussetzungen

- Ein VPS / Server mit **Docker + Docker Compose** (z. B. Hetzner CX-case, Contabo).
- DNS-Zugriff auf **scttrd.de** (beim Registrar oder im DNS-Panel).
- Alternatives: bestehender Server, der bereits Caddy/Docker nutzt — dann nur DNS + Stack starten.

## 1 · DNS einrichten

Beim Registrar/DNS-Anbieter von `scttrd.de` einen Eintrag anlegen:

| Typ | Name | Wert |
|---|---|---|
| `A` | `docs` | `<VPS-IP-Adresse>` |

Zusätzlich zeigen `scttrd.de` und `cms.scttrd.de` per A-Record auf denselben Server.

Danach prüfen:
```bash
nslookup docs.scttrd.de        # muss die VPS-IP zeigen
```

## 2 · Stack auf den Server kopieren & konfigurieren

```bash
# Auf dem VPS:
mkdir -p /opt/scttrd-wiki && cd /opt/scttrd-wiki
# Ordner "wiki" aus diesem Repo hierher kopieren (scp/rsync), dann:

cp .env.example .env
openssl rand -hex 32          # Ausgabe als APP_SECRET eintragen
# .env editieren: APP_SECRET + POSTGRES_PASSWORD ersetzen (und optional SMTP auskommentieren)
```

## 3 · Starten

```bash
docker compose -f compose.prod.yaml --profile proxy up -d
docker compose -f compose.prod.yaml ps
```

Beim ersten Start erzeugt Caddy automatisch ein Let's-Encrypt-Zertifikat für `docs.scttrd.de`
(erfordert, dass der DNS-Eintrag bereits zeigt).

## 4 · Erster Login

1. **https://docs.scttrd.de** öffnen.
2. Admin-Konto anlegen (angezeigt nur beim allerersten Besuch).
3. Workspace-Namen vergeben (z. B. `SCTTRD`).

> ⚠️ Pro Workspace entsteht immer ein Konto — das erste Konto wird Admin. Weitere Personen per
> Einladung (Spaces → Mitglieder). Einladungsmails brauchen SMTP (siehe `.env`), sonst Links manuell teilen.

## 5 · Meeting-/Seiten-Import (ohne Klicken)

Docmost **Community** hat keine lizenzierte REST-API, aber der Seiten-/ZIP-Import ist Teil der
Open-Source-Edition und intern über `/api/pages/import-zip` erreichbar. Ein Skript macht den
Import in einem Kommando — auch für den späteren VPS:

```bash
# In wiki/ (braucht Login-Credentials des Docmost-Admin-Kontos):
.\import.ps1 -Email <wiki-login> -Password <wiki-passwort> -BaseUrl http://localhost:3100
```

- Zips liegen unter `wiki/content/import/<slug>.zip`; Mapping (slug→zip) steht oben im Skript.
- Seiten-Jour-fixe erzeugen: `.\new-jour-fixe.ps1 -Date 2026-09-17` → erzeugt eine Seite mit der
  **60-Minuten-Band-Jour-Fixe-Struktur** (Blitzlicht, Status/Blocker, Musik, Business-Thema,
  Task-Check, Warteliste, „Hüter der Stunde"). Titel = `Jour fixe · JJJJ-MM-TT` (ISO!), weil
  Docmost die Sidebar alphabetisch sortiert — so laufen die Termine chronologisch.
- Daneben funktioniert der manuelle Weg weiter: Space → `...` neben Pages → **Import pages** →
  ZIP/Markdown wählen.

Optional einbettbar: Die Share-Funktion einer Seite erzeugt einen öffentlichen,
read-only Link (`/share/...`), den ihr z. B. in E-Mails oder auf der Hauptseite verlinken könnt.

## 6 · Updates

```bash
cd /opt/scttrd-wiki
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
```

## 7 · Backup

Alle Daten liegen in Docker-Volumes (`docmost_data`, `db_data`, `redis_data`). Ein sinnvolles
Backup = Datenbank-Dump + Volume-Kopie:

```bash
# Postgres-Dump (empfohlen, läuft im laufenden Betrieb):
docker compose -f compose.prod.yaml exec -T db pg_dump -U docmost docmost > docmost_$(date +%F).sql

# Voll-Backup als Volume-Snapshot:
docker run --rm -v scttrd-wiki_db_data:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/db_data_$(date +%F).tar.gz -C /data .
```

> Doku: https://docmost.com/docs/self-hosting · Repo: https://github.com/docmost/docmost
