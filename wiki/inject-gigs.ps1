# Injects dated gig blocks (3 jour-fixes-before-Gig rule) into jour-fixe pages.
# ASCII-only source. Data: content/.gig-inject.tsv (UTF-8).
$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)
$pages = Join-Path $PSScriptRoot "content\pages"
$data  = Join-Path $PSScriptRoot "content\.gig-inject.tsv"

$byDate = @{}
foreach ($line in (Get-Content $data -Encoding UTF8)) {
    if ($line -like "#*" -or -not $line.Trim()) { continue }
    $t = $line.Split("`t")
    if ($t.Count -ge 3) {
        $iso = $t[0].Trim(); $type = $t[1].Trim(); $text = ($t[2..($t.Count-1)] -join "`t").Trim()
        if (-not $byDate.ContainsKey($iso)) { $byDate[$iso] = New-Object System.Collections.Generic.List[string] }
        if ($type -eq "H") { $byDate[$iso].Add("### " + $text) }
        elseif ($type -eq "I") { $byDate[$iso].Add("- " + $text) }
    }
}

foreach ($date in $byDate.Keys) {
    $file = Join-Path $pages "jour-fixe-$date.md"
    if (-not (Test-Path $file)) { Write-Warning "fehlt: $file"; continue }
    $lines = [System.IO.File]::ReadAllLines($file)

    $idx = -1
    for ($i = 0; $i -lt $lines.Length; $i++) { if ($lines[$i].StartsWith("## 3")) { $idx = $i; break } }
    if ($idx -lt 0) { Write-Warning "Abschnitt 3 nicht gefunden: $date"; continue }

    $out = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i].StartsWith("### Gig-Vorbereitung")) { continue }
        if ($lines[$i].Contains("Anstehende Gigs werden hier")) { continue }
        $out.Add($lines[$i])
        if ($i -eq $idx) {
            foreach ($blk in $byDate[$date]) { $out.Add($blk) }
        }
    }
    [System.IO.File]::WriteAllLines($file, $out, $utf8)
    Write-Host "ok: $date"
}