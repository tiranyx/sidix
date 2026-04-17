@echo off
echo ============================================
echo  SIDIX — Publish All Queued Drafts
echo ============================================
echo.
echo Ini akan publish 16 draft ke brain/public/
echo dan rebuild index otomatis.
echo.

cd /d "D:\MIGHAN Model\apps\brain_qa"

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: venv tidak ditemukan. Jalankan install-deps.bat dulu!
    pause
    exit /b 1
)

echo [1/3] Publish semua draft...
for %%f in (".data\curation_drafts\draft__*.md") do (
    echo   Publishing: %%~nxf
    .venv\Scripts\python.exe -m brain_qa curate publish "%%f"
)
echo.

echo [2/3] Re-index corpus...
.venv\Scripts\python.exe -m brain_qa index
if %errorlevel% neq 0 (
    echo ERROR: index gagal.
    pause
    exit /b 1
)
echo.

echo [3/3] Update curation dashboard...
.venv\Scripts\python.exe -m brain_qa curate dashboard
echo.

echo ============================================
echo  SELESAI — Corpus diupdate!
echo  Cek: apps\brain_qa\.data\curation_dashboard.md
echo ============================================
pause
