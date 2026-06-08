<?php
// Скрипт для получения данных из базы данных (работает локально)
header('Content-Type: application/json');

// Подключаем класс Database
require_once 'database/Database.php';

try {
    $db = Database::getInstance();
    
    // Получаем тип данных
    $type = $_GET['type'] ?? 'about';
    
    switch ($type) {
        case 'about':
            $sql = "SELECT * FROM about_images ORDER BY upload_date DESC";
            $key = 'images';
            break;
        case 'gallery':
            $sql = "SELECT * FROM gallery_images ORDER BY upload_date DESC";
            $key = 'images';
            break;
        case 'hero':
            $sql = "SELECT * FROM hero_images ORDER BY upload_date DESC LIMIT 1";
            $key = 'image';
            break;
        default:
            throw new Exception("Неизвестный тип: $type");
    }
    
    $result = $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    
    if ($type === 'hero') {
        $response = [
            'success' => true,
            'image' => $result[0] ?? null
        ];
    } else {
        $images = array_map(function($row) {
            return [
                'id' => $row['id'],
                'name' => $row['name'],
                'data' => $row['data'],
                'size' => $row['size'],
                'type' => $row['type'],
                'uploadDate' => $row['upload_date']
            ];
        }, $result);
        
        $response = [
            'success' => true,
            'images' => $images
        ];
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
