@echo off
chcp 65001 >nul
setlocal
title Bản Làng Kiểu Mẫu — Dừng Dev Server

set "PORT=8080"
if not "%~1"=="" set "PORT=%~1"

echo ==========================================================
echo        ĐANG DỌN DẸP VÀ TẮT MÁY CHỦ TRÊN CỔNG %PORT%
echo ==========================================================
set "FOUND=0"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
    set "FOUND=1"
    echo Đang tắt tiến trình PID %%p...
    taskkill /PID %%p /F >nul 2>nul
)

if "%FOUND%"=="1" (
    echo [THÀNH CÔNG] Đã giải phóng cổng %PORT%.
) else (
    echo [THÔNG BÁO] Không phát hiện máy chủ nào đang chạy trên cổng %PORT%.
)
echo ==========================================================
timeout /t 2 /nobreak >nul
exit /b 0
