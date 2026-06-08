<?php
// Инициализация базы данных SQLite

try {
    // Подключаемся к базе данных (создастся если не существует)
    $db = new SQLite3('database.sqlite');
    
    // Создаем таблицу для изображений о нас
    $db->exec('
        CREATE TABLE IF NOT EXISTS about_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            size INTEGER NOT NULL,
            type TEXT NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    // Создаем таблицу для галереи
    $db->exec('
        CREATE TABLE IF NOT EXISTS gallery_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            size INTEGER NOT NULL,
            type TEXT NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    // Создаем таблицу для фона главного экрана
    $db->exec('
        CREATE TABLE IF NOT EXISTS hero_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            size INTEGER NOT NULL,
            type TEXT NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    echo "База данных успешно инициализирована!";
    
} catch (Exception $e) {
    echo "Ошибка при инициализации базы данных: " . $e->getMessage();
}
?>
