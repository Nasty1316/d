<?php
/**
 * API для управления новостями
 * Горецкая ДЮСШ
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка OPTIONS запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../database/Database.php';

// Проверка аутентификации для POST, PUT, DELETE запросов
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        exit;
    }
    
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    if ($token !== 'demo-token') {
        http_response_code(401);
        echo json_encode(['error' => 'Неверный токен авторизации']);
        exit;
    }
}

try {
    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    switch ($method) {
        case 'GET':
            handleGet($db, $action);
            break;
        case 'POST':
            handlePost($db);
            break;
        case 'PUT':
            handlePut($db);
            break;
        case 'DELETE':
            handleDelete($db);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Обработка GET запросов
 */
function handleGet($db, $action) {
    switch ($action) {
        case 'categories':
            getNewsCategories($db);
            break;
        case 'featured':
            getFeaturedNews($db);
            break;
        case 'stats':
            getNewsStats($db);
            break;
        default:
            getAllNews($db);
    }
}

/**
 * Получение всех новостей
 */
function getAllNews($db) {
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 10);
    $category = $_GET['category'] ?? '';
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? 'published';
    
    $offset = ($page - 1) * $limit;
    
    $where = ["n.status = :status"];
    $params = ['status' => $status];
    
    if ($category) {
        $where[] = "nc.slug = :category";
        $params['category'] = $category;
    }
    
    if ($search) {
        $where[] = "(n.title LIKE :search OR n.content LIKE :search OR n.excerpt LIKE :search)";
        $params['search'] = "%{$search}%";
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Получение новостей
    $sql = "SELECT n.*, nc.name as category_name, nc.color as category_color
            FROM news n
            LEFT JOIN news_categories nc ON n.category_id = nc.id
            WHERE {$whereClause}
            ORDER BY n.published_at DESC, n.created_at DESC
            LIMIT :limit OFFSET :offset";
    
    $params['limit'] = $limit;
    $params['offset'] = $offset;
    
    $news = $db->fetchAll($sql, $params);
    
    // Получение общего количества
    $countSql = "SELECT COUNT(*) as total
                 FROM news n
                 LEFT JOIN news_categories nc ON n.category_id = nc.id
                 WHERE {$whereClause}";
    
    $countResult = $db->fetch($countSql, $params);
    $total = $countResult['total'];
    
    // Форматирование дат
    foreach ($news as &$item) {
        $item['published_at'] = formatDate($item['published_at']);
        $item['created_at'] = formatDate($item['created_at']);
        $item['updated_at'] = formatDate($item['updated_at']);
    }
    
    echo json_encode([
        'data' => $news,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * Получение категорий новостей
 */
function getNewsCategories($db) {
    $sql = "SELECT nc.*, COUNT(n.id) as news_count
            FROM news_categories nc
            LEFT JOIN news n ON nc.id = n.category_id AND n.status = 'published'
            GROUP BY nc.id
            ORDER BY nc.name";
    
    $categories = $db->fetchAll($sql);
    
    echo json_encode($categories);
}

/**
 * Получение избранных новостей
 */
function getFeaturedNews($db) {
    $limit = (int)($_GET['limit'] ?? 3);
    
    $sql = "SELECT n.*, nc.name as category_name, nc.color as category_color
            FROM news n
            LEFT JOIN news_categories nc ON n.category_id = nc.id
            WHERE n.status = 'published' AND n.is_featured = 1
            ORDER BY n.published_at DESC
            LIMIT :limit";
    
    $news = $db->fetchAll($sql, ['limit' => $limit]);
    
    foreach ($news as &$item) {
        $item['published_at'] = formatDate($item['published_at']);
        $item['created_at'] = formatDate($item['created_at']);
        $item['updated_at'] = formatDate($item['updated_at']);
    }
    
    echo json_encode($news);
}

/**
 * Получение статистики новостей
 */
function getNewsStats($db) {
    $stats = [];
    
    // Общее количество новостей
    $stats['total'] = $db->count('news');
    
    // Опубликованные новости
    $stats['published'] = $db->count('news', 'status = "published"');
    
    // Черновики
    $stats['draft'] = $db->count('news', 'status = "draft"');
    
    // В архиве
    $stats['archived'] = $db->count('news', 'status = "archived"');
    
    // Избранные
    $stats['featured'] = $db->count('news', 'is_featured = 1');
    
    // Новости по категориям
    $sql = "SELECT nc.name, COUNT(n.id) as count
            FROM news_categories nc
            LEFT JOIN news n ON nc.id = n.category_id
            GROUP BY nc.id, nc.name
            ORDER BY count DESC";
    
    $stats['by_category'] = $db->fetchAll($sql);
    
    echo json_encode($stats);
}

/**
 * Обработка POST запросов (создание новости)
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Неверный формат данных']);
        return;
    }
    
    // Валидация
    $required = ['title', 'content'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Поле {$field} обязательно для заполнения"]);
            return;
        }
    }
    
    // Генерация slug
    $slug = generateSlug($input['title']);
    
    // Проверка уникальности slug
    $existing = $db->fetch("SELECT id FROM news WHERE slug = :slug", ['slug' => $slug]);
    if ($existing) {
        $slug .= '-' . time();
    }
    
    // Подготовка данных
    $data = [
        'title' => $input['title'],
        'slug' => $slug,
        'content' => $input['content'],
        'excerpt' => $input['excerpt'] ?? substr(strip_tags($input['content']), 0, 200),
        'category_id' => $input['category_id'] ?? null,
        'image_url' => $input['image_url'] ?? null,
        'status' => $input['status'] ?? 'published',
        'is_featured' => $input['is_featured'] ?? 0,
        'published_at' => $input['published_at'] ?? date('Y-m-d H:i:s')
    ];
    
    try {
        $db->beginTransaction();
        
        // Вставка новости
        $newsId = $db->insert('news', $data);
        
        // Логирование действия
        logAction($db, 'create', 'news', $newsId, null, $data);
        
        $db->commit();
        
        // Получение созданной новости
        $news = $db->findById('news', $newsId);
        $news['published_at'] = formatDate($news['published_at']);
        $news['created_at'] = formatDate($news['created_at']);
        $news['updated_at'] = formatDate($news['updated_at']);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => $news,
            'message' => 'Новость успешно создана'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * Обработка PUT запросов (обновление новости)
 */
function handlePut($db) {
    $id = (int)($_GET['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID новости обязателен']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Неверный формат данных']);
        return;
    }
    
    // Получение текущей новости
    $current = $db->findById('news', $id);
    if (!$current) {
        http_response_code(404);
        echo json_encode(['error' => 'Новость не найдена']);
        return;
    }
    
    // Подготовка данных для обновления
    $data = [];
    
    if (isset($input['title']) && !empty($input['title'])) {
        $data['title'] = $input['title'];
        
        // Обновление slug если изменился заголовок
        if ($input['title'] !== $current['title']) {
            $slug = generateSlug($input['title']);
            $existing = $db->fetch("SELECT id FROM news WHERE slug = :slug AND id != :id", 
                                  ['slug' => $slug, 'id' => $id]);
            if ($existing) {
                $slug .= '-' . time();
            }
            $data['slug'] = $slug;
        }
    }
    
    if (isset($input['content']) && !empty($input['content'])) {
        $data['content'] = $input['content'];
        $data['excerpt'] = $input['excerpt'] ?? substr(strip_tags($input['content']), 0, 200);
    }
    
    $optionalFields = ['category_id', 'image_url', 'status', 'is_featured', 'published_at'];
    foreach ($optionalFields as $field) {
        if (isset($input[$field])) {
            $data[$field] = $input[$field];
        }
    }
    
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Нет данных для обновления']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Обновление новости
        $affected = $db->update('news', $data, 'id = :id', ['id' => $id]);
        
        if ($affected === 0) {
            $db->rollback();
            http_response_code(400);
            echo json_encode(['error' => 'Ошибка обновления новости']);
            return;
        }
        
        // Логирование действия
        logAction($db, 'update', 'news', $id, $current, $data);
        
        $db->commit();
        
        // Получение обновленной новости
        $news = $db->findById('news', $id);
        $news['published_at'] = formatDate($news['published_at']);
        $news['created_at'] = formatDate($news['created_at']);
        $news['updated_at'] = formatDate($news['updated_at']);
        
        echo json_encode([
            'success' => true,
            'data' => $news,
            'message' => 'Новость успешно обновлена'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * Обработка DELETE запросов (удаление новости)
 */
function handleDelete($db) {
    $id = (int)($_GET['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID новости обязателен']);
        return;
    }
    
    // Получение новости для логирования
    $news = $db->findById('news', $id);
    if (!$news) {
        http_response_code(404);
        echo json_encode(['error' => 'Новость не найдена']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Удаление новости
        $affected = $db->delete('news', 'id = :id', ['id' => $id]);
        
        if ($affected === 0) {
            $db->rollback();
            http_response_code(400);
            echo json_encode(['error' => 'Ошибка удаления новости']);
            return;
        }
        
        // Логирование действия
        logAction($db, 'delete', 'news', $id, $news, null);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Новость успешно удалена'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * Генерация slug из заголовка
 */
function generateSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-zа-яё0-9\s-]/u', '', $slug);
    $slug = preg_replace('/\s+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

/**
 * Форматирование даты
 */
function formatDate($date) {
    if (!$date) return null;
    return date('Y-m-d H:i:s', strtotime($date));
}

/**
 * Логирование действий администратора
 */
function logAction($db, $action, $entityType, $entityId, $oldValues, $newValues) {
    $logData = [
        'user_id' => 1, // В реальном приложении получить из сессии
        'action' => $action,
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'old_values' => $oldValues ? json_encode($oldValues) : null,
        'new_values' => $newValues ? json_encode($newValues) : null,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
    ];
    
    $db->insert('admin_logs', $logData);
}
?>
