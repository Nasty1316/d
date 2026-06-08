# Установка PHP для Windows

## Вариант 1: XAMPP (рекомендуется)

1. Скачайте XAMPP с официального сайта: https://www.apachefriends.org/
2. Установите XAMPP
3. Запустите XAMPP Control Panel
4. Включите Apache
5. Скопируйте папку `gorki-led-new` в `C:\xampp\htdocs\`
6. Откройте в браузере: `http://localhost/gorki-led-new/`

## Вариант 2: Отдельный PHP

1. Скачайте PHP с https://www.php.net/downloads.php
2. Распакуйте в `C:\php\`
3. Добавьте `C:\php` в PATH системы
4. Проверьте в командной строке: `php --version`

## Вариант 3: WampServer

1. Скачайте WampServer с https://www.wampserver.com/
2. Установите WampServer
3. Скопируйте проект в `C:\wamp64\www\`
4. Откройте: `http://localhost/gorki-led-new/`

## Проверка после установки

После установки откройте в браузере:
`http://localhost/gorki-led-new/check_php.php`

Вы должны увидеть информацию о версии PHP и статусе базы данных.
