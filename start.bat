@echo off
echo ================================
echo  Pornire FilipShop Chatbot AI
echo ================================

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
start "ngrok Rasa" cmd /k "ngrok start --all"

timeout /t 2 /nobreak >nul

echo [5/5] Pornire ngrok API...
start "ngrok API" cmd /k "ngrok start --all --config C:\Users\Madalin\AppData\Local\ngrok\ngrok2.yml"

echo ================================
echo  Totul pornit!
echo  Site: https://filipshop-chatbot-ai.vercel.app/
echo ================================
pause