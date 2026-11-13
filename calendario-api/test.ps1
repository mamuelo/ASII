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

Write-Host "Ejecutando pruebas unitarias y de integración..." -ForegroundColor Cyan
Set-Location $scriptDir
& $mvnCmd clean test
