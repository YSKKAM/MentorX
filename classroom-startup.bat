@echo off
echo Freeing ports 3000 and 3001 to prevent conflicts...
powershell -Command " = @(3000, 3001); foreach ( in ) {  = Get-NetTCPConnection -LocalPort  -ErrorAction SilentlyContinue; if () { foreach ( in ) { if (.OwningProcess -gt 0) { Stop-Process -Id .OwningProcess -Force -ErrorAction SilentlyContinue } } } }"

echo Starting Backend Server on port 3001...
start "Classroom Backend" /min cmd /c "cd /d C:\mera soda\vscode\java\final && npm run dev:server"

echo Starting Frontend Web on port 3000...
start "Classroom Web" /min cmd /c "cd /d C:\mera soda\vscode\java\final && npm run dev:web"

echo Dev servers successfully started!
timeout /t 3

