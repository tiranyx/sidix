@echo off
echo Cleaning personal data from SIDIX corpus...
echo.

set BASE=D:\MIGHAN Model\brain\public

:: Hapus folder personal
rmdir /s /q "%BASE%\portfolio"
rmdir /s /q "%BASE%\projects"
rmdir /s /q "%BASE%\roadmap"

:: Hapus file personal spesifik
del /q "%BASE%\sources\mighan-projects-overview.md"
del /q "%BASE%\research_notes\01_riset_awal_mighan_brain_1.md"
del /q "%BASE%\research_notes\02_research_queue.md"
del /q "%BASE%\glossary\01_glossary_template.md"
del /q "%BASE%\research_notes\00_research_note_template.md"
del /q "%BASE%\research_notes\00_template_contested_topic.md"
del /q "%BASE%\README.md"

echo Done! Personal files removed.
echo.
echo Reindexing corpus...
cd /d "D:\MIGHAN Model\apps\brain_qa"
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe -m brain_qa index
) else (
    python -m brain_qa index
)
echo.
echo Corpus cleaned and reindexed!
pause
