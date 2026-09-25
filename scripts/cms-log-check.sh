#!/bin/sh
set +e

COMPOSE='docker compose -f compose.all.yaml'

printf '%s\n' '=== CMS diagnostics ==='
date -u
printf '%s\n' '--- compose status ---'
$COMPOSE ps cms cms-db
printf '%s\n' '--- CMS health ---'
docker inspect --format='{{json .State.Health}}' scttrd-all-cms 2>&1
printf '%s\n' '--- local admin login ---'
docker exec scttrd-all-cms node -e "fetch('http://127.0.0.1:3000/admin/login').then(async r => { const body = await r.text(); console.log(JSON.stringify({status:r.status, hasLoginTitle:body.includes('Login - Payload')})); process.exit(r.ok && body.includes('Login - Payload') ? 0 : 1) }).catch(error => { console.error(error.message); process.exit(1) })" 2>&1
printf '%s\n' '--- public admin login ---'
curl -sS -o /dev/null -w 'status=%{http_code}\n' https://cms.scttrd.de/admin/login 2>&1
printf '%s\n' '--- CMS logs (last 200 lines) ---'
$COMPOSE logs --no-color --tail=200 cms 2>&1
