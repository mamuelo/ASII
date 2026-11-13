@echo off
setlocal
cd /d "%~dp0"

if defined JAVA_HOME goto check_mvn
if exist "..\\.tools\\jdk-17.0.21+9" (
    set "JAVA_HOME=%~dp0..\\.tools\\jdk-17.0.21+9"
    set "PATH=%JAVA_HOME%\\bin;%PATH%"
)

:check_mvn
if exist "..\\.tools\\apache-maven-3.9.9\\bin\\mvn.cmd" (
    set "MVN_CMD=%~dp0..\\.tools\\apache-maven-3.9.9\\bin\\mvn.cmd"
) else (
    set "MVN_CMD=mvn"
)

echo Ejecutando suite de pruebas unitarias y de integracion...
call "%MVN_CMD%" clean test
