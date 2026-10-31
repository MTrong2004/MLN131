@echo off
setlocal enabledelayedexpansion
set "MUSE_DIR=%USERPROFILE%\.config\muse"
if not exist "%MUSE_DIR%" if exist "%USERPROFILE%\.muse" set "MUSE_DIR=%USERPROFILE%\.muse"
set "PROFILES_DIR=%USERPROFILE%\.muse_profiles"
if not exist "%PROFILES_DIR%" mkdir "%PROFILES_DIR%"

if "%~1"=="" goto USAGE
if /i "%~1"=="save" goto SAVE
if /i "%~1"=="use" goto USE
if /i "%~1"=="list" goto LIST
if /i "%~1"=="status" goto STATUS
goto USAGE

:SAVE
if "%~2"=="" ( echo [!] Thieu ten: muse-manager.bat save <ten_acc> & exit /b 1 )
if not exist "%MUSE_DIR%" ( echo [!] Chua co session Muse de luu. Hay dang nhap truoc bang 'muse login'. & exit /b 1 )
robocopy "%MUSE_DIR%" "%PROFILES_DIR%\%~2" /E /NFL /NDL /NJH /NJS >nul
echo [OK] Da luu profile "%~2".
exit /b 0

:USE
if "%~2"=="" ( echo [!] Thieu ten: muse-manager.bat use <ten_acc> & exit /b 1 )
if not exist "%PROFILES_DIR%\%~2" ( echo [!] Profile "%~2" khong ton tai. & exit /b 1 )
if exist "%MUSE_DIR%" rd /s /q "%MUSE_DIR%"
robocopy "%PROFILES_DIR%\%~2" "%MUSE_DIR%" /E /NFL /NDL /NJH /NJS >nul
echo %~2 > "%PROFILES_DIR%\.current"
echo [OK] Da chuyen sang tai khoan: %~2
exit /b 0

:LIST
echo === Danh sach profile Muse ===
dir /b /ad "%PROFILES_DIR%"
exit /b 0

:STATUS
if exist "%PROFILES_DIR%\.current" (
    set /p CUR=<"%PROFILES_DIR%\.current"
    echo [*] Dang dung profile: !CUR!
) else (
    echo [*] Chua chon profile qua manager.
)
if exist "%MUSE_DIR%\config.json" (
    type "%MUSE_DIR%\config.json"
)
exit /b 0

:USAGE
echo Cach dung:
echo   muse-manager.bat save ^<ten^>   : Luu session hien tai thanh profile
echo   muse-manager.bat use ^<ten^>    : Chuyen sang dung profile nay
echo   muse-manager.bat list          : Xem danh sach profile
echo   muse-manager.bat status        : Xem profile dang active
exit /b 0
