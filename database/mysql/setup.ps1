# Creates the luxuryshop database and the luxury_app user.
# Run ONCE from the project root:   powershell -ExecutionPolicy Bypass -File database\mysql\setup.ps1
#
# It asks for the MySQL ROOT password (hidden as you type). Root is only used here, to
# create the app user. The app itself always connects as luxury_app, which can only touch
# the luxuryshop database. Safe to run again: it updates the password instead of failing.

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\..\.."

# --- read .env --------------------------------------------------------------
$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) { throw ".env not found. Copy .env.example to .env and fill it in first." }
$cfg = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$' } | ForEach-Object { $cfg[$Matches[1]] = $Matches[2].Trim() }
foreach ($k in 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD') {
  if (-not $cfg[$k]) { throw "$k is missing in .env" }
}
if ($cfg.MYSQL_PASSWORD -match "['\\]") { throw "MYSQL_PASSWORD must not contain quotes or backslashes." }

# --- find mysql.exe ---------------------------------------------------------
$mysql = (Get-Command mysql -ErrorAction SilentlyContinue).Source
if (-not $mysql) {
  $mysql = Get-ChildItem "$env:ProgramFiles\MySQL\MySQL Server *\bin\mysql.exe" | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $mysql) { throw "mysql.exe not found. Is MySQL Server installed?" }

$db = $cfg.MYSQL_DATABASE; $user = $cfg.MYSQL_USER; $pw = $cfg.MYSQL_PASSWORD
$sql = @"
CREATE DATABASE IF NOT EXISTS ``$db`` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS '$user'@'localhost' IDENTIFIED BY '$pw';
CREATE USER IF NOT EXISTS '$user'@'127.0.0.1' IDENTIFIED BY '$pw';
ALTER USER '$user'@'localhost' IDENTIFIED BY '$pw';
ALTER USER '$user'@'127.0.0.1' IDENTIFIED BY '$pw';
GRANT ALL PRIVILEGES ON ``$db``.* TO '$user'@'localhost';
GRANT ALL PRIVILEGES ON ``$db``.* TO '$user'@'127.0.0.1';
FLUSH PRIVILEGES;
"@

# --- ask for root password (hidden) and run ----------------------------------
$secure = Read-Host "MySQL ROOT password" -AsSecureString
$env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
try {
  $sql | & $mysql --user=root --host=127.0.0.1 --protocol=TCP
  if ($LASTEXITCODE -ne 0) { throw "MySQL returned an error (wrong root password?)" }
} finally {
  Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Done: database '$db' and user '$user' are ready." -ForegroundColor Green
Write-Host "The app connects as '$user' with the password stored in .env."
