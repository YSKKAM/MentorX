$logDir = "$env:USERPROFILE\.gemini\antigravity\logs"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir }
$logFile = "$logDir\auto-start.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Auto-start script triggered. Checking internet connection..." | Out-File $logFile -Append

$maxAttempts = 24
$attempt = 0
$internet = $false
while ($attempt -lt $maxAttempts) {
    if (Test-Connection -ComputerName 8.8.8.8 -Count 1 -Quiet) {
        $internet = $true
        break
    }
    $attempt++
    Start-Sleep -Seconds 5
}

if (-not $internet) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] Internet connection check timed out. Exiting." | Out-File $logFile -Append
    exit
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Internet is available. Checking for active dev servers and freeing ports 3000/3001..." | Out-File $logFile -Append

# Kill any existing processes holding ports 3000 and 3001 to prevent conflicts
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        foreach ($c in $conn) {
            if ($c.OwningProcess -gt 0) {
                Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
                "[$timestamp] Stopped process $($c.OwningProcess) holding port $port." | Out-File $logFile -Append
            }
        }
    }
}

Start-Sleep -Seconds 2

# Launch the development servers in minimized PowerShell windows
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Launching Backend Server on port 3001 and Frontend Web on port 3000..." | Out-File $logFile -Append

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\mera soda\vscode\java\final'; npm run dev:server" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\mera soda\vscode\java\final'; npm run dev:web" -WindowStyle Minimized

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Both servers successfully launched." | Out-File $logFile -Append

