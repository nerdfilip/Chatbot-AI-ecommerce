@echo off
echo ================================
echo  Pornire FilipShop Chatbot AI
echo ================================
set SQLALCHEMY_SILENCE_UBER_WARNING=1
set PYTHONWARNINGS=ignore::DeprecationWarning

echo [0/5] Oprire instante vechi...
powershell -NoProfile -Command "$targets = Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'python.exe' -and ($_.CommandLine -match 'rasa\.exe run --enable-api' -or $_.CommandLine -match 'rasa\.exe run actions' -or $_.CommandLine -match 'api_server\.py')) -or $_.Name -eq 'ngrok.exe' }; $targets | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [1/5] Pornire Rasa Server...
start "Rasa Server" cmd /k "cd /d C:\Users\Madalin\Desktop\Personal\Dissertation\chatbot-ecommerce\rasa && call ..\.venv\Scripts\activate && rasa run --enable-api --cors *"

timeout /t 3 /nobreak >nul

echo [2/5] Pornire Action Server...
start "Action Server" cmd /k "cd /d C:\Users\Madalin\Desktop\Personal\Dissertation\chatbot-ecommerce\rasa && call ..\.venv\Scripts\activate && rasa run actions"

timeout /t 2 /nobreak >nul

echo [3/5] Pornire API Server...
start "API Server" cmd /k "cd /d C:\Users\Madalin\Desktop\Personal\Dissertation\chatbot-ecommerce\rasa && call ..\.venv\Scripts\activate && python api_server.py"

timeout /t 2 /nobreak >nul

echo [4/5] Pornire ngrok Rasa...
start "ngrok Rasa" cmd /k "ngrok start --all --config C:\Users\Madalin\AppData\Local\ngrok\ngrok-rasa.yml"

timeout /t 2 /nobreak >nul

echo [5/5] Pornire ngrok API...
start "ngrok API" cmd /k "ngrok start --all --config C:\Users\Madalin\AppData\Local\ngrok\ngrok2.yml"

echo ================================
echo  Totul pornit!
echo  Site: https://filipshop-chatbot-ai.vercel.app/
echo ================================
pause