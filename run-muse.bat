@echo off
setlocal
set "ROOT=%~dp0"
cd /d "%ROOT%"
title Muse Code CLI

set "PATH=%LOCALAPPDATA%\Programs\muse;%PATH%"

where muse >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Chua tim thay Muse Code CLI tren he thong.
    echo [*] Dang tai va cai dat Muse Code qua PowerShell...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://dev.meta.ai/install.ps1 | iex"
    set "PATH=%LOCALAPPDATA%\Programs\muse;%PATH%"
)

where muse >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Khoi dong Muse Code tai: %cd%
    call muse %*
) else (
    echo [!] Khong the khoi dong Muse Code.
    pause
)
