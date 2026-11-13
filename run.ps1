#Requires -Version 5.1
<#
.SYNOPSIS
    Inicia todos los servicios del Taller ASII (API 1 Express + API 2 Spring Boot + PostgreSQL)
.DESCRIPTION
    - Verifica herramientas y dependencias.
    - Levanta PostgreSQL via Docker Compose (si Docker está disponible).
    - Inicia API 1 (Express + MongoDB en memoria) en puerto 3000.
    - Inicia API 2 (Spring Boot + PostgreSQL) en puerto 8080.
.PARAMETER SkipApi1
    Omite el inicio de API 1 (Express.js).
.PARAMETER SkipApi2
    Omite el inicio de API 2 (Spring Boot).
.PARAMETER Mode
    Modo de API 1: 'memory' (default, sin MongoDB real) o 'real' (requiere MongoDB instalado).
#>
param(
    [switch]$SkipApi1,
    [switch]$SkipApi2,
    [ValidateSet("memory","real")]
    [string]$Mode = "memory"
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ─────────────────────────── COLORES ────────────────────────────
function Write-Header($msg)  { Write-Host "`n════════════════════════════════════════" -ForegroundColor DarkCyan; Write-Host "  $msg" -ForegroundColor Cyan; Write-Host "════════════════════════════════════════" -ForegroundColor DarkCyan }
function Write-OK($msg)      { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Info($msg)    { Write-Host "  ℹ️  $msg" -ForegroundColor Gray }

# ─────────────────────────── HERRAMIENTAS ───────────────────────
Write-Header "VERIFICACIÓN DE HERRAMIENTAS"

# Java / JDK
$toolsDir = Join-Path $scriptDir ".tools"
$jdkPath  = Join-Path $toolsDir "jdk-17.0.21+9"
if (Test-Path "$jdkPath\bin\java.exe") {
    $env:JAVA_HOME = $jdkPath
    $env:PATH = "$jdkPath\bin;$env:PATH"
    Write-OK "JDK 17 (portable): $jdkPath"
} elseif (Get-Command java -ErrorAction SilentlyContinue) {
    $javaVer = (java -version 2>&1 | Select-String "version").ToString()
    Write-OK "Java del sistema: $javaVer"
} else {
    Write-Fail "Java no encontrado. Necesitas JDK 17+."
    Write-Info "Instala JDK portable: descarga desde https://adoptium.net/ y coloca en .tools\"
    if (-not $SkipApi2) { Write-Warn "API 2 (Spring Boot) no podrá iniciarse sin Java." }
}

# Maven
$mvnCmd = $null
$mvnPath = Join-Path $toolsDir "apache-maven-3.9.9\bin\mvn.cmd"
if (Test-Path $mvnPath) {
    $mvnCmd = $mvnPath
    Write-OK "Maven 3.9.9 (portable): $mvnPath"
} elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
    $mvnCmd = "mvn"
    Write-OK "Maven del sistema: $(mvn -version 2>&1 | Select-Object -First 1)"
} else {
    Write-Fail "Maven no encontrado."
    if (-not $SkipApi2) { Write-Warn "API 2 (Spring Boot) no podrá compilarse sin Maven." }
}

# Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node --version
    Write-OK "Node.js: $nodeVer"
    if (-not (Test-Path (Join-Path $scriptDir "node_modules"))) {
        Write-Warn "node_modules no encontrado. Ejecuta: npm install"
    }
} else {
    Write-Fail "Node.js no encontrado."
    if (-not $SkipApi1) { Write-Warn "API 1 (Express) no podrá iniciarse sin Node.js." }
}

# Docker
$dockerOk = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerTest = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerOk = $true
        Write-OK "Docker Desktop: activo"
    } else {
        Write-Warn "Docker instalado pero el demonio no responde. Inicia Docker Desktop manualmente."
        Write-Info "Luego vuelve a ejecutar este script."
    }
} else {
    Write-Warn "Docker no encontrado. PostgreSQL debe estar instalado manualmente."
}

# ─────────────────────────── POSTGRESQL ─────────────────────────
Write-Header "POSTGRESQL"

$pgRunning = $false

# Verificar si ya escucha en 5432
$pgListen = netstat -an 2>$null | Select-String ":5432 "
if ($pgListen) {
    $pgRunning = $true
    Write-OK "PostgreSQL ya está escuchando en puerto 5432."
} elseif ($dockerOk) {
    Write-Info "Iniciando PostgreSQL via Docker Compose..."
    $composeFile = Join-Path $scriptDir "calendario-api\docker-compose.yml"
    if (Test-Path $composeFile) {
        Push-Location (Join-Path $scriptDir "calendario-api")
        docker compose up -d 2>&1 | ForEach-Object { Write-Info $_ }
        Pop-Location

        # Esperar hasta 30s a que PostgreSQL esté listo
        $attempts = 0
        Write-Info "Esperando que PostgreSQL acepte conexiones..."
        do {
            Start-Sleep -Seconds 3
            $attempts++
            $pgListen = netstat -an 2>$null | Select-String ":5432 "
        } while (-not $pgListen -and $attempts -lt 10)

        if ($pgListen) {
            $pgRunning = $true
            Write-OK "PostgreSQL listo en puerto 5432."
        } else {
            Write-Fail "PostgreSQL no respondió en 30s. Verifica Docker Desktop."
        }
    } else {
        Write-Fail "No se encontró calendario-api\docker-compose.yml"
    }
} elseif (Get-Service postgresql* -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running') {
    $pgRunning = $true
    Write-OK "Servicio PostgreSQL del sistema corriendo."
} else {
    Write-Fail "PostgreSQL no está disponible."
    Write-Info "Opciones:"
    Write-Info "  1. Inicia Docker Desktop y vuelve a ejecutar .\run.ps1"
    Write-Info "  2. Instala PostgreSQL: winget install PostgreSQL.PostgreSQL.17"
    Write-Info "  3. Desde calendario-api\: docker compose up -d"
    if (-not $SkipApi2) {
        Write-Warn "API 2 (Spring Boot) fallará sin PostgreSQL. Continúa de todas formas..."
    }
}

# ─────────────────────────── API 1: EXPRESS ─────────────────────
$api1Job = $null
if (-not $SkipApi1) {
    Write-Header "ENTREGA 3 — EXPRESS.JS + MONGODB (Festivos Colombia)"

    $nodeModulesPath = Join-Path $scriptDir "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Warn "node_modules no encontrado. Instalando dependencias de API 1..."
        Push-Location $scriptDir
        npm install
        Pop-Location
    }

    $indexScript = if ($Mode -eq "memory") {
        Join-Path $scriptDir "src\index.memory.js"
    } else {
        Join-Path $scriptDir "src\index.js"
    }

    if (-not (Test-Path $indexScript)) {
        Write-Fail "No se encontró: $indexScript"
    } else {
        $modeLabel = if ($Mode -eq "memory") { "MongoDB en memoria (autónomo)" } else { "MongoDB real" }
        Write-Info "Modo: $modeLabel"
        Write-Info "Iniciando API 1 en http://localhost:3000 ..."

        # Cargar .env si existe
        if (Test-Path (Join-Path $scriptDir ".env")) {
            $envContent = Get-Content (Join-Path $scriptDir ".env") | Where-Object { $_ -notmatch "^#" -and $_ -match "=" }
            foreach ($line in $envContent) {
                $parts = $line -split "=", 2
                if ($parts.Count -eq 2) { [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process") }
            }
        }

        $api1Job = Start-Job -ScriptBlock {
            param($dir, $script)
            Set-Location $dir
            $env:PORT = "3000"
            node $script
        } -ArgumentList $scriptDir, $indexScript

        # Esperar hasta 20s a que API 1 levante
        $ready = $false
        for ($i = 0; $i -lt 10; $i++) {
            Start-Sleep -Seconds 2
            try {
                $r = Invoke-WebRequest -Uri "http://localhost:3000/api/festivos/obtener/2024" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                if ($r.StatusCode -eq 200) { $ready = $true; break }
            } catch { }
        }

        if ($ready) {
            Write-OK "API 1 lista: http://localhost:3000"
        } else {
            Write-Warn "API 1 puede estar todavía iniciando (mongodb-memory-server tarda ~15s la primera vez)."
            Write-Info "Logs disponibles con: Receive-Job -Id $($api1Job.Id)"
        }
    }
}

# ─────────────────────────── API 2: SPRING BOOT ─────────────────
$api2Job = $null
if (-not $SkipApi2) {
    Write-Header "ENTREGA 4 — SPRING BOOT + POSTGRESQL (Calendario)"

    if (-not $pgRunning) {
        Write-Warn "PostgreSQL no está disponible. Spring Boot arrancará pero fallará al conectar."
    }

    $calendarioDir = Join-Path $scriptDir "calendario-api"
    if (-not (Test-Path $calendarioDir)) {
        Write-Fail "Directorio calendario-api no encontrado."
    } elseif ($null -eq $mvnCmd) {
        Write-Fail "Maven no disponible. No se puede iniciar API 2."
    } else {
        Write-Info "Iniciando API 2 (Spring Boot) en http://localhost:8080 ..."

        $api2Job = Start-Job -ScriptBlock {
            param($dir, $mvn, $javaHome)
            Set-Location $dir
            if ($javaHome) { $env:JAVA_HOME = $javaHome; $env:PATH = "$javaHome\bin;$env:PATH" }
            & $mvn spring-boot:run
        } -ArgumentList $calendarioDir, $mvnCmd, $env:JAVA_HOME

        # Esperar hasta 60s a que Spring Boot levante
        $ready = $false
        Write-Info "Esperando que Spring Boot arranque (puede tardar 30-60s)..."
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Seconds 3
            try {
                $r = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                if ($r.StatusCode -eq 200) { $ready = $true; break }
            } catch { }
            # Verificar que el job no haya fallado
            if ($api2Job.State -eq "Failed") { break }
        }

        if ($ready) {
            Write-OK "API 2 lista: http://localhost:8080"
        } elseif ($api2Job.State -eq "Failed") {
            Write-Fail "API 2 falló al iniciar."
            Write-Info "Logs:"
            Receive-Job -Job $api2Job | Select-Object -Last 20 | ForEach-Object { Write-Info $_ }
        } else {
            Write-Warn "API 2 aún no responde en /actuator/health (puede seguir iniciando)."
            Write-Info "Logs disponibles con: Receive-Job -Id $($api2Job.Id)"
        }
    }
}

# ─────────────────────────── RESUMEN ────────────────────────────
Write-Header "SERVICIOS ACTIVOS"
Write-Host ""
if ($api1Job -and $api1Job.State -ne "Failed") {
    Write-OK "Entrega 3 — Festivos Colombia (Express.js)"
    Write-Info "    URL:          http://localhost:3000"
    Write-Info "    Swagger UI:   http://localhost:3000/api-docs"
    Write-Info "    Festivos:     http://localhost:3000/api/festivos/obtener/2024"
    Write-Info "    Job ID:       $($api1Job.Id)"
}
if ($api2Job -and $api2Job.State -ne "Failed") {
    Write-OK "Entrega 4 — Calendario Anual (Spring Boot + PostgreSQL)"
    Write-Info "    URL:          http://localhost:8080"
    Write-Info "    Swagger UI:   http://localhost:8080/swagger-ui/index.html"
    Write-Info "    Generar:      http://localhost:8080/api/calendario/generar/2024"
    Write-Info "    Listar:       http://localhost:8080/api/calendario/listar/2024"
    Write-Info "    Health:       http://localhost:8080/actuator/health"
    Write-Info "    Job ID:       $($api2Job.Id)"
}
Write-Host ""
Write-Info "Para detener todos los servicios:"
Write-Info "    Get-Job | Stop-Job; Get-Job | Remove-Job"
Write-Info "Para ver logs en tiempo real:"
Write-Info "    Receive-Job -Id <JobId> -Keep"
Write-Host ""

# Mantener el script activo si ambas APIs se iniciaron
if (($api1Job -or $SkipApi1) -and ($api2Job -or $SkipApi2)) {
    Write-Header "MONITOREANDO SERVICIOS (Ctrl+C para salir)"
    try {
        while ($true) {
            Start-Sleep -Seconds 10
            $jobs = @()
            if ($api1Job) { $jobs += [PSCustomObject]@{Name="API 1"; Job=$api1Job} }
            if ($api2Job) { $jobs += [PSCustomObject]@{Name="API 2"; Job=$api2Job} }
            foreach ($j in $jobs) {
                if ($j.Job.State -eq "Failed") {
                    Write-Fail "$($j.Name) falló. Últimos logs:"
                    Receive-Job -Job $j.Job | Select-Object -Last 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
                }
            }
        }
    } finally {
        Write-Info "Deteniendo servicios..."
        if ($api1Job) { Stop-Job -Job $api1Job; Remove-Job -Job $api1Job }
        if ($api2Job) { Stop-Job -Job $api2Job; Remove-Job -Job $api2Job }
        Write-OK "Servicios detenidos."
    }
}
