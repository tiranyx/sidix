@echo off
:: Setup Windows Task Scheduler untuk SIDIX Auto-Knowledge Fetcher
:: Jalankan sekali saja sebagai Administrator

echo.
echo ================================================
echo   Setup: SIDIX Auto-Knowledge Fetcher
echo   (Task Scheduler - Jalankan saat Login)
echo ================================================
echo.

:: Hapus task lama jika ada
schtasks /delete /tn "SIDIX-StartupFetch" /f 2>nul

:: Buat task baru — jalankan saat user login, delay 3 menit
schtasks /create ^
  /tn "SIDIX-StartupFetch" ^
  /tr "\"D:\MIGHAN Model\startup-fetch.bat\"" ^
  /sc ONLOGON ^
  /delay 0003:00 ^
  /rl HIGHEST ^
  /f

if %ERRORLEVEL% == 0 (
    echo.
    echo [OK] Task "SIDIX-StartupFetch" berhasil dibuat!
    echo      Akan berjalan 3 menit setelah login.
    echo.
    echo Untuk test sekarang:
    echo   schtasks /run /tn "SIDIX-StartupFetch"
    echo.
    echo Untuk lihat status:
    echo   schtasks /query /tn "SIDIX-StartupFetch" /fo list
) else (
    echo.
    echo [ERROR] Gagal membuat task.
    echo Coba jalankan script ini sebagai Administrator.
    echo.
    echo Manual alternative:
    echo 1. Buka Task Scheduler
    echo 2. Create Basic Task: "SIDIX-StartupFetch"
    echo 3. Trigger: When I log on
    echo 4. Action: Start a program
    echo 5. Program: D:\MIGHAN Model\startup-fetch.bat
    echo 6. Delay: 3 minutes
)

echo.
pause
