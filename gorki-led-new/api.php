<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Подключение к базе данных через класс Database
require_once 'database/Database.php';
try {
    $db = Database::getInstance();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка подключения к базе данных: ' . $e->getMessage()]);
    exit;
}

// Получаем метод запроса
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Обработка запросов
switch ($method) {
    case 'GET':
        if ($action === 'get_about_images') {
            getAboutImages();
        } elseif ($action === 'get_gallery_images') {
            getGalleryImages();
        } elseif ($action === 'get_hero_images') {
            getHeroImages();
        }
        break;
        
    case 'POST':
        if ($action === 'save_about_images') {
            saveAboutImages();
        } elseif ($action === 'save_gallery_images') {
            saveGalleryImages();
        } elseif ($action === 'save_hero_images') {
            saveHeroImages();
        }
        break;
        
    case 'DELETE':
        if ($action === 'delete_about_images') {
            deleteAboutImages();
        } elseif ($action === 'delete_gallery_images') {
            deleteGalleryImages();
        } elseif ($action === 'delete_hero_images') {
            deleteHeroImages();
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестный метод']);
        break;
}

// Функции для работы с изображениями о нас
function getAboutImages() {
    global $db;
    
    try {
        $result = $db->fetchAll('SELECT * FROM about_images ORDER BY upload_date DESC');
        $images = [];
        
        foreach ($result as $row) {
            $images[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'data' => $row['data'],
                'size' => $row['size'],
                'type' => $row['type'],
                'uploadDate' => $row['upload_date']
            ];
        }
        
        echo json_encode(['success' => true, 'images' => $images]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка получения изображений: ' . $e->getMessage()]);
    }
}

function saveAboutImages() {
    global $db;
    
    try {
        $images = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($images)) {
            echo json_encode(['success' => false, 'message' => 'Неверный формат данных']);
            return;
        }
        
        // Начинаем транзакцию
        $db->beginTransaction();
        
        // Очищаем старые изображения
        $db->delete('about_images', '1=1');
        
        // Добавляем новые изображения
        foreach ($images as $image) {
            $data = [
                'name' => $image['name'],
                'data' => $image['data'],
                'size' => $image['size'],
                'type' => $image['type'],
                'upload_date' => $image['uploadDate']
            ];
            $db->insert('about_images', $data);
        }
        
        // Завершаем транзакцию
        $db->commit();
        
        echo json_encode(['success' => true, 'message' => 'Изображения успешно сохранены в базу данных']);
    } catch (Exception $e) {
        $db->rollback();
        echo json_encode(['success' => false, 'message' => 'Ошибка сохранения изображений: ' . $e->getMessage()]);
    }
}

function deleteAboutImages() {
    global $db;
    
    try {
        $db->delete('about_images', '1=1');
        echo json_encode(['success' => true, 'message' => 'Изображения успешно удалены']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка удаления изображений: ' . $e->getMessage()]);
    }
}

// Функции для галереи
function getGalleryImages() {
    global $db;
    
    try {
        $result = $db->fetchAll('SELECT * FROM gallery_images ORDER BY upload_date DESC');
        $images = [];
        
        foreach ($result as $row) {
            $images[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'data' => $row['data'],
                'size' => $row['size'],
                'type' => $row['type'],
                'uploadDate' => $row['upload_date']
            ];
        }
        
        echo json_encode(['success' => true, 'images' => $images]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка получения галереи: ' . $e->getMessage()]);
    }
}

function saveGalleryImages() {
    global $db;
    
    try {
        $images = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($images)) {
            echo json_encode(['success' => false, 'message' => 'Неверный формат данных']);
            return;
        }
        
        $db->beginTransaction();
        $db->delete('gallery_images', '1=1');
        
        foreach ($images as $image) {
            $data = [
                'name' => $image['name'],
                'data' => $image['data'],
                'size' => $image['size'],
                'type' => $image['type'],
                'upload_date' => $image['uploadDate']
            ];
            $db->insert('gallery_images', $data);
        }
        
        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Галерея успешно сохранена']);
    } catch (Exception $e) {
        $db->rollback();
        echo json_encode(['success' => false, 'message' => 'Ошибка сохранения галереи: ' . $e->getMessage()]);
    }
}

function deleteGalleryImages() {
    global $db;
    
    try {
        $db->delete('gallery_images', '1=1');
        echo json_encode(['success' => true, 'message' => 'Галерея успешно удалена']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка удаления галереи: ' . $e->getMessage()]);
    }
}

// Функции для фона главного экрана
function getHeroImages() {
    global $db;
    
    try {
        $result = $db->fetchAll('SELECT * FROM hero_images ORDER BY upload_date DESC LIMIT 1');
        
        if (!empty($result)) {
            $image = $result[0];
            echo json_encode(['success' => true, 'image' => [
                'id' => $image['id'],
                'name' => $image['name'],
                'data' => $image['data'],
                'size' => $image['size'],
                'type' => $image['type'],
                'uploadDate' => $image['upload_date']
            ]]);
        } else {
            echo json_encode(['success' => true, 'image' => null]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка получения фона: ' . $e->getMessage()]);
    }
}

function saveHeroImages() {
    global $db;
    
    try {
        $image = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($image)) {
            echo json_encode(['success' => false, 'message' => 'Неверный формат данных']);
            return;
        }
        
        $db->beginTransaction();
        $db->delete('hero_images', '1=1');
        
        $data = [
            'name' => $image['name'],
            'data' => $image['data'],
            'size' => $image['size'],
            'type' => $image['type'],
            'upload_date' => $image['uploadDate']
        ];
        $db->insert('hero_images', $data);
        
        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Фон успешно сохранен']);
    } catch (Exception $e) {
        $db->rollback();
        echo json_encode(['success' => false, 'message' => 'Ошибка сохранения фона: ' . $e->getMessage()]);
    }
}

function deleteHeroImages() {
    global $db;
    
    try {
        $db->delete('hero_images', '1=1');
        echo json_encode(['success' => true, 'message' => 'Фон успешно удален']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка удаления фона: ' . $e->getMessage()]);
    }
}

// Закрываем соединение с базой данных
// База данных автоматически закрывается через класс Database
?>
