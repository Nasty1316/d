@echo off
chcp 65001 > nul

echo Запуск локального PHP сервера для доступа к базе данных...
echo Сервер: http://localhost:8000
echo Админка: http://localhost:8000/admin/login.html  (логин admin / пароль admin123)
echo Нажмите Ctrl+C для остановки сервера
echo.

cd /d "%~dp0"

:: Указываем прямой путь к PHP из XAMPP
"C:\xampp\php\php.exe" -S localhost:8000

pause