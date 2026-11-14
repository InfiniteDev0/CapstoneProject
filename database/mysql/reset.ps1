# Rebuilds the luxuryshop tables and loads the sample data, as the app user.
# Run from the project root:   powershell -ExecutionPolicy Bypass -File database\mysql\reset.ps1
#
# ⚠ This DELETES all rows in luxuryshop and starts fresh (schema.sql drops every table).
# Needs setup.ps1 to have been run once first (it creates the database and luxury_app).

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\..\.."

$cfg = @{}
Get-Content (Join-Path $root ".env") | Where-Object { $_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$' } | ForEach-Object { $cfg[$Matches[1]] = $Matches[2].Trim() }

$mysql = (Get-Command mysql -ErrorAction SilentlyContinue).Source
if (-not $mysql) {
  $mysql = Get-ChildItem "$env:ProgramFiles\MySQL\MySQL Server *\bin\mysql.exe" | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}

$hostName = if ($cfg.MYSQL_HOST) { $cfg.MYSQL_HOST } else { "localhost" }
$port = if ($cfg.MYSQL_PORT) { $cfg.MYSQL_PORT } else { "3306" }
$env:MYSQL_PWD = $cfg.MYSQL_PASSWORD
try {
  foreach ($file in "schema.sql", "seed.sql") {
    Write-Host "Running $file ..."
    Get-Content (Join-Path $PSScriptRoot $file) -Raw -Encoding UTF8 |
      & $mysql --user=$($cfg.MYSQL_USER) --host=$hostName --port=$port --protocol=TCP --default-character-set=utf8mb4 $cfg.MYSQL_DATABASE
    if ($LASTEXITCODE -ne 0) { throw "$file failed" }
  }
} finally {
  Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}
Write-Host "Done: luxuryshop rebuilt with sample data." -ForegroundColor Green
