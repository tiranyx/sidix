@echo off
:: SIDIX Auto-Knowledge Fetcher — dijalankan saat startup Windows
:: Setup: Task Scheduler → jalankan saat login → target file ini

echo.
echo ================================================
echo   SIDIX Knowledge Fetcher — Auto Startup
echo ================================================
echo.

cd /d "D:\MIGHAN Model"

:: Pakai .venv jika ada
if exist "apps\brain_qa\.venv\Scripts\python.exe" (
    set PYTHON=apps\brain_qa\.venv\Scripts\python.exe
) else (
    set PYTHON=python
)

echo Python: %PYTHON%
echo.

:: Fetch semua kategori, max 10 artikel per run (tidak ganggu startup)
%PYTHON% startup-fetch.py --max 10 --category ALL

echo.
echo Startup fetch selesai!
echo.
