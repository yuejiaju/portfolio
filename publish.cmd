@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1"
set "EXITCODE=%errorlevel%"
if not "%DSH_NO_PAUSE%"=="1" pause
exit /b %EXITCODE%
