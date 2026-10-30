@echo off
setlocal enabledelayedexpansion
title BAN LANG KIEU MAU - Game Dev Environment

:: ==========================================================
:: Duong dan goc va cau hinh mac dinh
:: ==========================================================
set "ROOT=%~dp0"
cd /d "%ROOT%"
set "PORT=8080"
set "PYTHONUTF8=1"

:: Xu ly tham so truyen vao: dev.bat [port] hoac dev.bat wt hoac dev.bat test
if not "%~1"=="" (
    if /i "%~1"=="wt" (
        goto START_WT
    ) else if /i "%~1"=="stop" (
        goto STOP_SERVER
    ) else if /i "%~1"=="test" (
        goto RUN_TEST
    ) else if /i "%~1"=="check" (
        goto RUN_TEST
    ) else (
        set "PORT=%~1"
    )
)

:: ==========================================================
:: Giao dien khoi dong tieu chuan
:: ==========================================================
cls
echo ==========================================================
echo        BAN LANG KIEU MAU - GAME DEV ENVIRONMENT
echo ==========================================================
echo  Thu muc   : %ROOT%
echo  Cong dev  : %PORT%
echo  Cong nghe : Python HTTP Server + Debounced Watch Gate
echo  Trinh duyet: Tu dong mo va tu dong reload (Live Reload)
echo ==========================================================
echo.

:: ==========================================================
:: Tien kiem tra: Python
:: ==========================================================
where python >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay Python trong PATH.
    echo       Cai dat Python 3.8+ tai https://www.python.org/
    pause
    exit /b 1
)

:: ==========================================================
:: Don dep cong cu neu dang bi chiem
:: ==========================================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
    echo [DON CONG] Phat hien tien trinh %%p dang giu cong %PORT%. Dang giai phong...
    taskkill /PID %%p /F >nul 2>nul
)

:: ==========================================================
:: Khoi chay may chu Live Reload
:: ==========================================================
echo [KHOI DONG] Dang mo may chu va theo doi file...
python -X utf8 serve.py --port %PORT%
if errorlevel 1 (
    echo.
    echo [LOI] May chu ket thuc voi ma loi %errorlevel%.
    pause
)
goto END

:START_WT
where wt.exe >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay Windows Terminal (wt.exe). Chay cmd thuong...
    goto START_NORMAL
)
wt.exe new-tab --title "Ban Lang Kieu Mau - Game Dev" cmd /k ""%ROOT%dev.bat""
exit /b 0

:STOP_SERVER
echo ==========================================================
echo        DANG DON DEP VA TAT MAY CHU TREN CONG %PORT%
echo ==========================================================
set "FOUND=0"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
    set "FOUND=1"
    echo Dang tat tien trinh PID %%p...
    taskkill /PID %%p /F >nul 2>nul
)
if "!FOUND!"=="1" (
    echo [THANH CONG] Da giai phong cong %PORT%.
) else (
    echo [THONG BAO] Khong co may chu nao dang chay tren cong %PORT%.
)
echo ==========================================================
goto END

:RUN_TEST
python -X utf8 serve.py --test
goto END

:END
exit /b 0
