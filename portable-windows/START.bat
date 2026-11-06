@echo off
chcp 65001 >nul
title DAKA - ثبت کد تأیید مرحله ۲
cd /d "%~dp0"

echo.
echo  ============================================
echo    DAKA  ^|  ثبت کد تأیید مرحله ۲
echo    شرکت کیهان سازه پارت  -  09157407617
echo  ============================================
echo.

set "APPDIR=%~dp0app"
set "PORT=8765"
set "URL=http://127.0.0.1:%PORT%/index.html"

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [*] در حال راه‌اندازی سرور محلی با Python ...
  start "DAKA-Server" /min cmd /c "cd /d \"%APPDIR%\" && python -m http.server %PORT%"
  timeout /t 2 /nobreak >nul
  start "" "%URL%"
  echo.
  echo [OK] برنامه در مرورگر باز شد.
  echo     برای بستن، این پنجره را ببندید و پنجره سرور را هم ببندید.
  echo.
  pause
  taskkill /FI "WINDOWTITLE eq DAKA-Server*" /F >nul 2>&1
  exit /b 0
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [*] در حال راه‌اندازی سرور محلی با py ...
  start "DAKA-Server" /min cmd /c "cd /d \"%APPDIR%\" && py -m http.server %PORT%"
  timeout /t 2 /nobreak >nul
  start "" "%URL%"
  echo.
  echo [OK] برنامه در مرورگر باز شد.
  echo.
  pause
  taskkill /FI "WINDOWTITLE eq DAKA-Server*" /F >nul 2>&1
  exit /b 0
)

echo [!] Python پیدا نشد — باز کردن مستقیم فایل در مرورگر...
start "" "%APPDIR%\index.html"
echo.
echo [OK] اگر صفحه درست باز نشد، Python را نصب کنید و دوباره اجرا کنید:
echo     https://www.python.org/downloads/
echo     (تیک Add Python to PATH را بزنید)
echo.
pause
