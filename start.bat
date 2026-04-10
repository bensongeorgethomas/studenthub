@echo off
echo Starting StudyHub Server...

:: Start the FastAPI backend server in a separate window
start "StudyHub Server" cmd /c "uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait a few seconds to ensure the server is fully up and running
echo Waiting for server to initialize...
timeout /t 3 /nobreak > NUL

:: Open the index page in the default web browser (main.py serves index.html at root route /)
echo Opening frontend in browser...
start http://127.0.0.1:8000/

echo Done! The server window can be closed directly when you are finished.
