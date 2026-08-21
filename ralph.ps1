while ($true) {
  if (!(Test-Path todo.md)) { break }
  if (!(Select-String todo.md -Pattern "- \[ \]" -Quiet)) { break }
  code-agent --prompt "Bearbeite den nächsten Task aus todo.md" --non-interactive --yolo
  if ($LASTEXITCODE -ne 0) { break }
}
