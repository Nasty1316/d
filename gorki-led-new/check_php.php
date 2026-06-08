<?php
echo "PHP Version: " . phpversion() . "\n";
echo "SQLite3 extension: " . (extension_loaded('sqlite3') ? 'YES' : 'NO') . "\n";
echo "PDO extension: " . (extension_loaded('pdo') ? 'YES' : 'NO') . "\n";
echo "PDO SQLite: " . (extension_loaded('pdo_sqlite') ? 'YES' : 'NO') . "\n";

// Проверяем доступ к базе данных
try {
    if (file_exists('database/gorki_led.db')) {
        $db = new PDO('sqlite:database/gorki_led.db');
        echo "Database connection: OK\n";
        
        // Проверяем таблицы
        $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
        echo "Tables: " . implode(', ', $tables) . "\n";
        
        // Проверяем изображения
        $count = $db->query("SELECT COUNT(*) FROM about_images")->fetchColumn();
        echo "About images count: " . $count . "\n";
    } else {
        echo "Database file not found\n";
    }
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>
