# Erzeugt eine neue, datierte Jour-fixe-Seite aus dem TEMPLATE.
# ASCII-only source! (PS 5.1 liest .ps1 als ANSI, non-ASCII Literals wuerden zerstoert.)
#
#   Beispiele:
#     .\new-jour-fixe.ps1                         # heute
#     .\new-jour-fixe.ps1 -Date 2026-09-17        # bestimmter Termin
#
#   Ausgabe: wiki/content/pages/jour-fixe-<datum>.md
#   Titel = "Jour fixe \u00b7 JJJJ-MM-TT" (ISO) - Docmost sortiert die Seiten-Sidebar
#   alphabetisch, daher ISO-Vorderteil, damit die Jour fixe chronologisch einsortieren.

param(
    [string]$Date = (Get-Date -Format "yyyy-MM-dd")
)

$ErrorActionPreference = "Stop"
$pages = Join-Path $PSScriptRoot "content\pages"
$template = Join-Path $pages "jour-fixe-TEMPLATE.md"
$out = Join-Path $pages "jour-fixe-$($Date).md"

if (-not (Test-Path $template)) { throw "Template nicht gefunden: $template" }
if (Test-Path $out) { Write-Warning "Existiert bereits: $out"; exit 1 }

$dot = [string][char]0x00B7   # U+00B7 MIDDLE DOT, nicht als Literal im Quelltext
$dateDe = [datetime]::ParseExact($Date, "yyyy-MM-dd", $null).ToString("dd.MM.yyyy")

$raw = Get-Content $template -Raw -Encoding UTF8
$raw = $raw.Replace("# Jour fixe $dot JJJJ-MM-TT", "# Jour fixe $dot $Date")
$raw = $raw.Replace('**Datum:** _(TT.MM.JJJJ)_', "**Datum:** $dateDe")

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($out, $raw, $utf8)
Write-Host "Neue Jour-fixe-Seite: $out"