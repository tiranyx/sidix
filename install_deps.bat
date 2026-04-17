@echo off
chcp 65001 >nul
echo ========================================
echo   Mighan-brain-1 — Install Dependencies
echo ========================================
echo.

cd /d "D:\MIGHAN Model\apps\brain_qa"

REM Check if venv exists
if not exist ".venv\Scripts\pip.exe" (
    echo [!] Virtual env tidak ditemukan. Membuat baru...
    python -m venv .venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Python tidak ditemukan. Install Python 3.10+ dulu.
        pause
        exit /b 1
    )
)

echo [1/2] Mengaktifkan venv...
call .venv\Scripts\activate.bat

echo [2/2] Install semua dependencies...
pip install -r requirements.txt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUKSES! Dependencies terinstall.
    echo  Test dengan: python -m brain_qa ask "test"
    echo ========================================
) else (
    echo.
    echo [ERROR] Install gagal. Cek koneksi internet.
)

echo.
pause
