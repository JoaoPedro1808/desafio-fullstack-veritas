# Script para encontrar e encerrar processos Go que possam estar bloqueando

Write-Host "Procurando processos Go..." -ForegroundColor Yellow

# Procura processos que podem ser do Go
$processes = Get-Process | Where-Object {
    $_.Path -like "*go-build*" -or 
    $_.ProcessName -like "*main*" -or
    $_.Path -like "*backend*" -or
    $_.CommandLine -like "*go run*" -or
    $_.CommandLine -like "*main.go*"
} -ErrorAction SilentlyContinue

if ($processes) {
    Write-Host "Processos encontrados:" -ForegroundColor Green
    $processes | Format-Table Id, ProcessName, Path -AutoSize
    
    $processes | ForEach-Object {
        Write-Host "Encerrando processo $($_.Id) - $($_.ProcessName)..." -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Processos encerrados!" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Go encontrado." -ForegroundColor Green
}

# Verifica se a porta 8080 está em uso
Write-Host "`nVerificando porta 8080..." -ForegroundColor Yellow
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue

if ($port8080) {
    Write-Host "Porta 8080 está em uso pelo processo: $($port8080.OwningProcess)" -ForegroundColor Red
    $pid = $port8080.OwningProcess
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Encerrando processo $pid ($($proc.ProcessName))..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "Processo encerrado!" -ForegroundColor Green
    }
} else {
    Write-Host "Porta 8080 está livre." -ForegroundColor Green
}

Write-Host "`nLimpeza concluída! Agora você pode executar 'go run .' novamente." -ForegroundColor Cyan

