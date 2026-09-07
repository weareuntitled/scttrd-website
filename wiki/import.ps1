# SCTTRD Wiki - Seiten per Docmost-Import-API einspielen (ohne UI-Klicken).
#
# Docmost legt die Tree-/Space-API unter /api/ intern an; SPREAD eingeschraenkter Zugang:
#   - Login:      POST /api/auth/login   (Cookie)
#   - Spaces:     POST /api/spaces/      (leerer Body -> Liste mit id/slug)
#   - ZIP-Import: POST /api/pages/import-zip  (multipart: file, spaceId, source=generic)
#
# Voraussetzungen: curl.exe im PATH (Windows 10+ vorhanden). Keine Enterprise-Lizenz noetig,
# der Import ist Teil der Open-Source-Edition.
#
#   Beispiele:
#     .\import.ps1 -Email admin@example.com -Password geheim
#     .\import.ps1 -Email ... -Password ... -BaseUrl https://docs.scttrd.de
#
# Ablage der Zips: content/import/<slug>.zip  (z. B. meetings-2026.zip fuer slug meetings).
# Mapping unten erweitern, wenn neue Zips dazukommen.

param(
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password,
    [string]$BaseUrl = "http://localhost:3100",
    [string]$ZipDir = (Join-Path $PSScriptRoot "content\import"),
    [string]$CookieJar = (Join-Path $env:TEMP "docmost-cookies.txt")
)

$ErrorActionPreference = "Stop"

# slug -> zip-Dateiname (relativ zu $ZipDir)
$mapping = [ordered]@{
    "meetings"        = "meetings-2026.zip"   # Jour fixe + Meetingplan
    "booking-live"    = "kalender.zip"        # Kalender-Termine + Gig-Seite
    "release-roadmap" = "release-roadmap.zip"
    "presse-rider"    = "presse-rider.zip"
    "regeln-betrieb"  = "regeln-betrieb.zip"
    "general"         = "general.zip"
}

if (Test-Path $CookieJar) { Remove-Item $CookieJar -Force }

Write-Host "Login: $BaseUrl ..."
$loginBody = '{"email":"' + $Email + '","password":"' + $Password + '"}'
$login = & curl.exe -s -c $CookieJar -X POST "$BaseUrl/api/auth/login" `
    -H "Content-Type: application/json" -d $loginBody
$loginJson = $login | ConvertFrom-Json
if (-not $loginJson.success) {
    throw "Login fehlgeschlagen: $login"
}

Write-Host "Spaces laden ..."
$spacesRaw = & curl.exe -s -b $CookieJar -X POST "$BaseUrl/api/spaces/" `
    -H "Content-Type: application/json" -d "{}"
$spaces = ($spacesRaw | ConvertFrom-Json).data.items

$count = 0
foreach ($svc in $mapping.GetEnumerator()) {
    $slug = $svc.Key; $zipName = $svc.Value
    $zipPath = Join-Path $ZipDir $zipName
    if (-not (Test-Path $zipPath)) { Write-Warning "ZIP fehlt: $zipPath - uebersprungen"; continue }
    $space = $spaces | Where-Object { $_.slug -eq $slug }
    if (-not $space) { Write-Warning "Space '$slug' nicht gefunden - uebersprungen"; continue }
    Write-Host "  Import '$zipName' -> $slug ..."
    $resp = & curl.exe -s -b $CookieJar -X POST "$BaseUrl/api/pages/import-zip" `
        -F "file=@$zipPath" -F "spaceId=$($space.id)" -F "source=generic"
    $json = $resp | ConvertFrom-Json
    if ($json.success) {
        $count++
        Write-Host "    OK (Task $($json.data.status))"
    } else {
        Write-Warning "    Fehler: $resp"
    }
}

Remove-Item $CookieJar -Force -ErrorAction SilentlyContinue
Write-Host "Fertig. $count Import(s) gestartet (vn async verarbeitet - kurz warten)."