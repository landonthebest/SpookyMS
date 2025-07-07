@echo off
cd /d "C:\Users\nightterror\Desktop\Spooky MS Server"

echo Running Maven build...
call mvnw.cmd clean package

echo.
echo Build finished. Press any key to exit.
pause >nul
