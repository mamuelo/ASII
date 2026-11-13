$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $env:JAVA_HOME -and (Test-Path "$scriptDir\..\.tools\jdk-17.0.21+9")) {
    $env:JAVA_HOME = Resolve-Path "$scriptDir\..\.tools\jdk-17.0.21+9"
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
}

$mvnCmd = "mvn"
if (Test-Path "$scriptDir\..\.tools\apache-maven-3.9.9\bin\mvn.cmd") {
    $mvnCmd = Resolve-Path "$scriptDir\..\.tools\apache-maven-3.9.9\bin\mvn.cmd"
}

Write-Host "Iniciando Spring Boot Calendario API..." -ForegroundColor Cyan
Write-Host "  URL Base:    http://localhost:8080" -ForegroundColor Gray
Write-Host "  Swagger UI:  http://localhost:8080/swagger-ui/index.html" -ForegroundColor Gray
Write-Host "  Health:      http://localhost:8080/actuator/health" -ForegroundColor Gray
Set-Location $scriptDir
& $mvnCmd spring-boot:run
