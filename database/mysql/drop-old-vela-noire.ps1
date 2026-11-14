# One-off clean-up: removes the OLD Vela Noire MySQL database and its user.
# LuxuryShop uses "luxuryshop" / "luxury_app", which are NOT touched.
# Run once from the project root:
#   powershell -ExecutionPolicy Bypass -File database\mysql\drop-old-vela-noire.ps1
# It asks for the MySQL ROOT password (hidden as you type).

$ErrorActionPreference = "Stop"

$mysql = (Get-Command mysql -ErrorAction SilentlyContinue).Source
if (-not $mysql) {
  $mysql = Get-ChildItem "$env:ProgramFiles\MySQL\MySQL Server *\bin\mysql.exe" | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $mysql) { throw "mysql.exe not found. Is MySQL Server installed?" }

$sql = @"
DROP DATABASE IF EXISTS ``vela_noire``;
DROP USER IF EXISTS 'vela_app'@'localhost';
DROP USER IF EXISTS 'vela_app'@'127.0.0.1';
FLUSH PRIVILEGES;
SHOW DATABASES;
"@

$secure = Read-Host "MySQL ROOT password" -AsSecureString
$env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
try {
  $sql | & $mysql --user=root --host=127.0.0.1 --protocol=TCP
  if ($LASTEXITCODE -ne 0) { throw "MySQL returned an error (wrong root password?)" }
} finally {
  Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}
Write-Host ""
Write-Host "Done: vela_noire and vela_app are gone. luxuryshop is untouched." -ForegroundColor Green
