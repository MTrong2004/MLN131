@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title BẢN LÀNG KIỂU MẪU — Dev Environment

:: ==========================================================
:: Đường dẫn gốc và cấu hình mặc định
:: ==========================================================
set "ROOT=%~dp0"
cd /d "%ROOT%"
set "PORT=8080"
set "PYTHONUTF8=1"

:: Xử lý tham số truyền vào: dev.bat [port] hoặc dev.bat wt
if not "%~1"=="" (
    if /i "%~1"=="wt" (
        goto START_WT
    ) else if /i "%~1"=="stop" (
        goto STOP_SERVER
    ) else (
        set "PORT=%~1"
    )
)

:: ==========================================================
:: Giao diện khởi động chuyên nghiệp
:: ==========================================================
cls
echo ==========================================================
echo        BẢN LÀNG KIỂU MẪU — GAME DEV ENVIRONMENT
echo ==========================================================
echo  Thư mục   : %ROOT%
echo  Cổng dev  : %PORT%
echo  Công nghệ : Python HTTP Server + Debounced Watch Gate
echo  Trình duyệt: Tự động mở & Tự động nạp lại (Live Reload)
echo ==========================================================
echo.

:: ==========================================================
:: Tiền kiểm tra: Python
:: ==========================================================
where python >nul 2>nul
if errorlevel 1 (
    echo [LỖI] Không tìm thấy Python trong PATH.
    echo       Cài đặt Python 3.8+ tại https://www.python.org/
    pause
    exit /b 1
)

:: ==========================================================
:: Dọn dẹp cổng cũ nếu đang bị tiến trình khác chiếm
:: ==========================================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
    echo [DỌN CỔNG] Phát hiện tiến trình %%p đang giữ cổng %PORT%. Đang giải phóng...
    taskkill /PID %%p /F >nul 2>nul
)

:: ==========================================================
:: Khởi chạy máy chủ Live Reload
:: ==========================================================
echo [KHỞI ĐỘNG] Đang mở máy chủ và lắng nghe thay đổi file...
python -X utf8 serve.py --port %PORT%
if errorlevel 1 (
    echo.
    echo [LỖI] Máy chủ kết thúc với mã lỗi %errorlevel%.
    pause
)
goto END

:START_WT
where wt.exe >nul 2>nul
if errorlevel 1 (
    echo [LỖI] Không tìm thấy Windows Terminal (wt.exe). Khởi chạy CMD thông thường...
    goto START_NORMAL
)
wt.exe new-tab --title "Bản Làng Kiểu Mẫu - Game Dev" cmd /k ""%ROOT%dev.bat""
exit /b 0

:STOP_SERVER
call "%ROOT%stop-dev.bat" %PORT%
goto END

:END
exit /b 0
