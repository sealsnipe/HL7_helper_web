@echo off
echo Starting HL7 Helper Dev Server...
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0hl7-helper-web"
npm run dev
